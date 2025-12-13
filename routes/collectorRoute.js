import express from "express";
import Collector from "../models/Collector.js";
import jwt from "jsonwebtoken";
import auth from "../middleware/authMiddleware.js";
import Customer from "../models/Customer.js";

const router = express.Router();


// CREATE COLLECTOR (Admin use)
router.post("/create", async (req, res) => {
  try {
    const collector = new Collector(req.body);
    await collector.save();

    res.json({
      success: true,
      message: "Collector created successfully",
      collector,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Collector creation failed",
      error: err.message,
    });
  }
});

// GET ALL COLLECTORS
router.get("/all", async (req, res) => {
  try {
    const collectors = await Collector.find();

    res.json({
      success: true,
      data: collectors
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load collectors",
      error: error.message
    });
  }
});



// =============================
// CREATE COLLECTOR
// =============================
router.post("/add", async (req, res) => {
  try {
    const { name, phone, password, area } = req.body;

    if (!name || !phone || !password || !area) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    const exists = await Collector.findOne({ phone });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Collector already exists"
      });
    }

    const collector = new Collector({
      name,
      phone: phone.trim(),
      password: password.trim(),
      area
    });

    await collector.save();

    res.json({
      success: true,
      message: "Collector created successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Collector creation failed",
      error: err.message
    });
  }
});


// =============================
// COLLECTOR LOGIN
// =============================
router.post("/login", async (req, res) => {
  try {
    let { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone & password required"
      });
    }

    phone = phone.trim();
    password = password.trim();

    const collector = await Collector.findOne({ phone });
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found"
      });
    }

    const isMatch = await collector.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: collector._id, role: "collector" },
      "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      collector: {
        id: collector._id,
        name: collector.name,
        phone: collector.phone,
        area: collector.area
      }
    });

  } catch (err) {
    console.error("Collector login error:", err);
    res.status(500).json({
      success: false,
      message: "Collector login failed"
    });
  }
});


router.post("/login-v2", async (req, res) => {
  try {
    let { phone, password } = req.body;

    // 🧼 CLEAN INPUT
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone aur password required hai"
      });
    }

    phone = String(phone).trim();
    password = String(password).trim();

    // 🔍 FIND COLLECTOR
    const collector = await Collector.findOne({ phone });

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found"
      });
    }

    // 🔑 PASSWORD CHECK
    const isMatch = await collector.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

    // 🎟 TOKEN
    const token = jwt.sign(
      { id: collector._id, role: "collector" },
      "secret123",
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Collector login successful",
      token,
      collector: {
        id: collector._id,
        name: collector.name,
        phone: collector.phone,
        area: collector.area
      }
    });

  } catch (error) {
    console.error("Collector Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error in collector login",
      error: error.message
    });
  }
});



// =============================
// ASSIGN CUSTOMER TO COLLECTOR
// =============================
router.post("/assign", async (req, res) => {
  try {
    const { collectorId, customerId } = req.body;

    // 1 — collector find
    const collector = await Collector.findById(collectorId);
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found"
      });
    }

    // 2 — customer find
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // 3 — avoid duplicate assignment
    if (!collector.assignedCustomers.includes(customerId)) {
      collector.assignedCustomers.push(customerId);
      await collector.save();
    }

    res.json({
      success: true,
      message: "Customer Assigned Successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Assignment failed",
      error: error.message
    });
  }
});


// =============================
// GET ASSIGNED CUSTOMERS (Protected)
// =============================
router.get("/customers", auth, async (req, res) => {
  try {
    const collector = await Collector.findById(req.collector._id)
      .populate("assignedCustomers");

    res.json({
      success: true,
      data: collector.assignedCustomers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load customers",
      error: error.message
    });
  }
});

// COLLECTOR PERFORMANCE REPORT (Admin)
router.get("/performance", async (req, res) => {
  try {
    const collectors = await Collector.find().populate("assignedCustomers");

    const report = collectors.map(col => {
      const totalAssigned = col.assignedCustomers.length;

      const totalRecovered = col.assignedCustomers.reduce(
        (sum, c) => sum + (c.amountPaid || 0),
        0
      );

      const totalPending = col.assignedCustomers.reduce(
        (sum, c) => sum + (c.remainingAmount || 0),
        0
      );

      const visited = col.assignedCustomers.filter(c => c.visitStatus === "visited").length;
      const wrongAddress = col.assignedCustomers.filter(c => c.visitStatus === "wrong_address").length;
      const promised = col.assignedCustomers.filter(c => c.visitStatus === "promised").length;
      const notHome = col.assignedCustomers.filter(c => c.visitStatus === "not_home").length;

      return {
        collectorName: col.name,
        phone: col.phone,
        area: col.area,
        totalAssigned,
        totalRecovered,
        totalPending,
        visited,
        wrongAddress,
        promised,
        notHome
      };
    });

    res.json({
      success: true,
      performance: report
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch performance report",
      error: error.message
    });
  }
});

// ==============================
// AREA-WISE RECOVERY REPORT
// ==============================
router.get("/area/report", async (req, res) => {
  try {
    const collectors = await Collector.find().populate("assignedCustomers");

    let areaReport = {};

    collectors.forEach(collector => {
      const area = collector.area;

      if (!areaReport[area]) {
        areaReport[area] = {
          areaName: area,
          totalAssigned: 0,
          totalRecovered: 0,
          totalPending: 0,
          visited: 0,
          wrongAddress: 0,
          promised: 0,
          notHome: 0
        };
      }

      collector.assignedCustomers.forEach(cust => {
        areaReport[area].totalAssigned += 1;
        areaReport[area].totalRecovered += cust.amountPaid || 0;
        areaReport[area].totalPending += cust.remainingAmount || 0;

        if (cust.visitStatus === "visited") areaReport[area].visited += 1;
        if (cust.visitStatus === "wrong_address") areaReport[area].wrongAddress += 1;
        if (cust.visitStatus === "promised") areaReport[area].promised += 1;
        if (cust.visitStatus === "not_home") areaReport[area].notHome += 1;
      });
    });

    res.json({
      success: true,
      areaReport
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch area report",
      error: error.message
    });
  }
});

export default router;