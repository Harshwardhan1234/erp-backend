import express from "express";
import Collector from "../models/Collector.js";
import Customer from "../models/Customer.js";
import jwt from "jsonwebtoken";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

/* ===============================
   CREATE COLLECTOR (ADMIN)
   =============================== */
router.post("/create", async (req, res) => {
  try {
    const { name, phone, password, area } = req.body;

    if (!name || !phone || !password || !area) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const exists = await Collector.findOne({ phone: phone.trim() });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Collector already exists" });
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
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* ===============================
   COLLECTOR LOGIN
   =============================== */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const collector = await Collector.findOne({ phone: phone.trim() });
    if (!collector) {
      return res
        .status(404)
        .json({ success: false, message: "Collector not found" });
    }

    const isMatch = await collector.comparePassword(password.trim());
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: collector._id, role: "collector" },
      "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      collector: {
        id: collector._id,
        name: collector.name,
        phone: collector.phone,
        area: collector.area,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

/* ===============================
   COLLECTOR DASHBOARD (FIXED)
   =============================== */
router.get("/dashboard", auth, async (req, res) => {
  try {
    // 🔥 ONLY assignedTo — single source of truth
    const customers = await Customer.find({
      assignedTo: req.collector._id,
    });

    const pendingAmount = customers.reduce(
      (sum, c) => sum + (c.remainingAmount || 0),
      0
    );

    res.json({
      success: true,
      stats: {
        totalAssigned: customers.length,
        pendingAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
});

/* ===============================
   GET ASSIGNED CUSTOMERS (MY CASES)
   =============================== */
router.get("/customers", auth, async (req, res) => {
  try {
    const customers = await Customer.find({
      assignedTo: req.collector._id,
    });

    res.json({
      success: true,
      customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned customers",
    });
  }
});


export default router;
