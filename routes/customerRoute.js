import express from "express";
import Customer from "../models/Customer.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

/* ===============================
   ADD CUSTOMER (ADMIN)
   =============================== */
router.post("/add", async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();

    res.json({
      success: true,
      message: "Customer added successfully 🚀",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding customer",
      error: error.message,
    });
  }
});

/* ===============================
   GET ALL CUSTOMERS (ADMIN)
   =============================== */
router.get("/all", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
});

/* ===============================
   UPDATE CUSTOMER
   =============================== */
router.put("/update/:id", async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Customer updated successfully",
      customer: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
});

/* ===============================
   DELETE CUSTOMER
   =============================== */
router.delete("/delete/:id", async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Customer deleted successfully ❌",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
});

/* ===============================
   ASSIGN CUSTOMER TO COLLECTOR
   (SINGLE SOURCE OF TRUTH)
   =============================== */
// ASSIGN CUSTOMER TO COLLECTOR (FINAL)
router.put("/assign/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { collectorId } = req.body;

    if (!collectorId) {
      return res.status(400).json({
        success: false,
        message: "Collector ID required",
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const collector = await Collector.findById(collectorId);
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found",
      });
    }

    // 🔥 SINGLE FIELD (IMPORTANT)
    customer.assignedTo = collectorId;
    await customer.save();

    res.json({
      success: true,
      message: "Customer assigned successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Assignment failed",
      error: error.message,
    });
  }
});


/* ===============================
   COLLECT PAYMENT (COLLECTOR)
   =============================== */
router.post("/payment/:customerId", auth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { paidAmount } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.paymentHistory.push({
      paidAmount,
      date: new Date(),
    });

    customer.amountPaid += paidAmount;
    customer.remainingAmount =
      customer.loanAmount - customer.amountPaid;

    customer.status =
      customer.remainingAmount <= 0 ? "paid" : "pending";

    await customer.save();

    res.json({
      success: true,
      message: "Payment submitted successfully 💰",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Payment submission failed",
      error: error.message,
    });
  }
});

/* ===============================
   VISIT UPDATE (COLLECTOR)
   =============================== */
router.put("/visit/:id", async (req, res) => {
  try {
    const { status, promiseDate } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { visitStatus: status, promiseDate },
      { new: true }
    );

    res.json({
      success: true,
      message: "Visit updated successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Visit update failed",
    });
  }
});

/* ===============================
   ADMIN DASHBOARD SUMMARY
   =============================== */
router.get("/summary", async (req, res) => {
  try {
    const customers = await Customer.find();

    const totalRecovered = customers.reduce(
      (sum, c) => sum + (c.amountPaid || 0),
      0
    );

    const totalLoan = customers.reduce(
      (sum, c) => sum + (c.loanAmount || 0),
      0
    );

    const today = new Date().toISOString().slice(0, 10);

    const todayCollection = customers.reduce((sum, c) => {
      const todayPayments = c.paymentHistory.filter(
        (p) =>
          p.date.toISOString().slice(0, 10) === today
      );
      return (
        sum +
        todayPayments.reduce((s, p) => s + p.paidAmount, 0)
      );
    }, 0);

    res.json({
      success: true,
      summary: {
        totalCustomers: customers.length,
        totalRecovered,
        totalPending: totalLoan - totalRecovered,
        todayCollection,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch summary",
    });
  }
});

export default router;
