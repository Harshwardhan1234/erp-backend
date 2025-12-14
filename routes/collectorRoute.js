import express from "express";
import Collector from "../models/Collector.js";
import jwt from "jsonwebtoken";
import auth from "../middleware/authMiddleware.js";
import Customer from "../models/Customer.js";

const router = express.Router();

/* ===============================
   CREATE COLLECTOR (ADMIN)
   =============================== */
router.post("/create", async (req, res) => {
  try {
    const { name, phone, password, area } = req.body;

    if (!name || !phone || !password || !area) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const exists = await Collector.findOne({ phone: phone.trim() });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Collector already exists",
      });
    }

    const collector = new Collector({
      name: name.trim(),
      phone: phone.trim(),
      password: password.trim(),
      area: area.trim(),
    });

    await collector.save();

    res.json({
      success: true,
      message: "Collector created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Collector creation failed",
      error: error.message,
    });
  }
});

/* ===============================
   COLLECTOR LOGIN (FINAL & CLEAN)
   =============================== */
router.post("/login", async (req, res) => {
  try {
    let { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password required",
      });
    }

    phone = phone.trim();
    password = password.trim();

    const collector = await Collector.findOne({ phone });
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found",
      });
    }

    const isMatch = await collector.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      { id: collector._id, role: "collector" },
      "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Collector login successful",
      token,
      collector: {
        id: collector._id,
        name: collector.name,
        phone: collector.phone,
        area: collector.area,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Collector login failed",
      error: error.message,
    });
  }
});

/* ===============================
   ASSIGN CUSTOMER
   =============================== */
router.post("/assign", async (req, res) => {
  try {
    const { collectorId, customerId } = req.body;

    const collector = await Collector.findById(collectorId);
    if (!collector) {
      return res.status(404).json({ success: false, message: "Collector not found" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (!collector.assignedCustomers.includes(customerId)) {
      collector.assignedCustomers.push(customerId);
      await collector.save();
    }

    res.json({ success: true, message: "Customer assigned successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Assignment failed",
      error: error.message,
    });
  }
});

/* ===============================
   GET ASSIGNED CUSTOMERS
   =============================== */
router.get("/customers", auth, async (req, res) => {
  try {
    const collector = await Collector.findById(req.collector._id).populate(
      "assignedCustomers"
    );

    res.json({
      success: true,
      data: collector.assignedCustomers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load customers",
      error: error.message,
    });
  }
});

export default router;
