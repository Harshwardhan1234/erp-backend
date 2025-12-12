import express from "express";
import Customer from "../models/Customer.js";
import Collector from "../models/Collector.js";
import auth from "../middleware/authMiddleware.js";


const router = express.Router();

// ADD CUSTOMER (POST API)
router.post("/add", async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();

    res.json({ message: "Customer Added Successfully 🚀" });
  } catch (err) {
    res.status(500).json({ error: "Error saving customer data" });
  }
});


// Get all customers
router.get("/all", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// Update customer by ID
router.put("/update/:id", async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    res.json({
      success: true,
      message: "Customer Updated Successfully",
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update Failed" });
  }
});

// Delete customer by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Customer Deleted Successfully ❌"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete Failed" });
  }
});

// Add payment for a customer
router.post("/pay/:id", async (req, res) => {
  try {
    const { paidAmount } = req.body;

    // 1. Get customer
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // 2. Add payment history
    customer.paymentHistory.push({
      paidAmount: paidAmount,
      date: new Date()
    });

    // 3. Update amounts
    customer.amountPaid += paidAmount;
    customer.remainingAmount = customer.loanAmount - customer.amountPaid;

    // 4. Update status
    if (customer.remainingAmount <= 0) {
      customer.status = "paid";
    } else {
      // If due date passed & still not paid
      const today = new Date();
      if (today > customer.dueDate) {
        customer.status = "overdue";
      } else {
        customer.status = "pending";
      }
    }

    // 5. Save update
    await customer.save();

    res.json({
      success: true,
      message: "Payment Added Successfully 💰",
      data: customer
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment failed",
      error: error.message
    });
  }
});


// Assign customer to collector
router.post("/assign/:customerId/:collectorId", async (req, res) => {
  try {
    const { customerId, collectorId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const collector = await Collector.findById(collectorId);
    if (!collector) return res.status(404).json({ success: false, message: "Collector not found" });

    // Assign
    customer.assignedTo = collectorId;
    await customer.save();

    // Add customer to collector's assigned list
    collector.assignedCustomers.push(customerId);
    await collector.save();

    res.json({
      success: true,
      message: "Customer assigned to collector successfully 🔥"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Assignment failed", error: error.message });
  }
});


// UPDATE VISIT STATUS
router.put("/visit/:id", async (req, res) => {
  try {
    const { status, promiseDate } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { visitStatus: status, promiseDate },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({
      success: true,
      message: "Visit status updated",
      data: customer
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating visit status",
      error: error.message
    });
  }
});

// COLLECTOR PAYMENT SUBMISSION
router.post("/collect-payment/:id", async (req, res) => {
  try {
    const { paidAmount } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Add payment to history
    customer.paymentHistory.push({
      paidAmount,
      date: new Date()
    });

    // Update amounts
    customer.amountPaid += paidAmount;
    customer.remainingAmount = customer.loanAmount - customer.amountPaid;

    // Auto-update loan status
    if (customer.remainingAmount <= 0) {
      customer.status = "paid";
    }

    await customer.save();

    res.json({
      success: true,
      message: "Payment submitted successfully 💰",
      data: customer
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment submission failed",
      error: error.message
    });
  }
});

   // ADMIN DASHBOARD SUMMARY
router.get("/summary", async (req, res) => {
  try {
    const customers = await Customer.find();

    const totalCustomers = customers.length;

    const totalRecovered = customers.reduce((sum, c) => sum + c.amountPaid, 0);

    const totalLoanAmount = customers.reduce((sum, c) => sum + c.loanAmount, 0);

    const totalPending = totalLoanAmount - totalRecovered;

    const paidCount = customers.filter(c => c.status === "paid").length;

    const pendingCount = customers.filter(c => c.status !== "paid").length;

    const today = new Date().toISOString().slice(0, 10);

    const todayCollection = customers.reduce((sum, c) => {
      const todayPayments = c.paymentHistory.filter(
        p => p.date.toISOString().slice(0,10) === today
      );
      return sum + todayPayments.reduce((s, p) => s + p.paidAmount, 0);
    }, 0);

    res.json({
      success: true,
      summary: {
        totalCustomers,
        totalRecovered,
        totalPending,
        paidCount,
        pendingCount,
        todayCollection
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get summary",
      error: error.message
    });
  }
});

// ==============================
// PROMISE DATE REMINDER SYSTEM
// ==============================

// TODAY PROMISE CUSTOMERS
router.get("/promise/today", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const customers = await Customer.find({
      promiseDate: { $exists: true, $ne: null }
    });

    const todayPromises = customers.filter(
      c => c.promiseDate.toISOString().slice(0, 10) === today
    );

    res.json({ success: true, todayPromises });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch today's promise data",
      error: error.message
    });
  }
});

// TOMORROW PROMISE CUSTOMERS
router.get("/promise/tomorrow", async (req, res) => {
  try {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const customers = await Customer.find({
      promiseDate: { $exists: true, $ne: null }
    });

    const tomorrowPromises = customers.filter(
      c => c.promiseDate.toISOString().slice(0, 10) === tomorrow
    );

    res.json({ success: true, tomorrowPromises });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tomorrow's promise data",
      error: error.message
    });
  }
});

// OVERDUE PROMISE CUSTOMERS (PROMISE BROKEN)
router.get("/promise/overdue", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const customers = await Customer.find({
      promiseDate: { $exists: true, $ne: null }
    });

    const overdue = customers.filter(
      c => c.promiseDate.toISOString().slice(0, 10) < today
    );

    res.json({ success: true, overdue });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch overdue promise customers",
      error: error.message
    });
  }
});

router.put("/assign/:id", async (req, res) => {
  try {
    const { collectorId } = req.body;

    await Customer.findByIdAndUpdate(req.params.id, {
      assignedTo: collectorId
    });

    res.json({ success: true, message: "Customer assigned successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to assign customer" });
  }
});



router.get("/all", async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { area: { $regex: search, $options: "i" } }
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// SUBMIT PAYMENT
router.post("/payment/:customerId", auth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { paidAmount } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    customer.amountPaid += paidAmount;
    customer.remainingAmount = customer.loanAmount - customer.amountPaid;

    // Add payment to history
    customer.paymentHistory.push({
      paidAmount,
      date: new Date(),
    });

    await customer.save();

    res.json({
      success: true,
      message: "Payment submitted successfully 💰",
      data: customer
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error submitting payment",
      error: error.message
    });
  }
});



export default router;
