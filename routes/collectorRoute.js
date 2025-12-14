import express from "express";
import Collector from "../models/Collector.js";
import Customer from "../models/Customer.js";
import jwt from "jsonwebtoken";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const collector = await Collector.findOne({ phone });
    if (!collector) {
      return res.status(404).json({ message: "Collector not found" });
    }

    const isMatch = await collector.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: collector._id },
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
    res.status(500).json({ message: "Login failed" });
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
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});
export default router;
