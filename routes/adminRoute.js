import express from "express";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// REGISTER ADMIN (one time)
router.post("/register", async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();

    res.json({ success: true, message: "Admin Registered Successfully 🚀" });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
});

// LOGIN ADMIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid password" });

    const token = jwt.sign({ id: admin._id, role: "admin" }, "secret123", { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Admin login successful",
      token
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
});

export default router;
