import express from "express";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import Collector from "../models/Collector.js";

const router = express.Router();

// CREATE ADMIN (One time use)
router.post("/create", async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();

    res.json({
      success: true,
      message: "Admin created successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error creating admin",
      error: err.message,
    });
  }
});
// ADMIN REPORTS (Dashboard + Reports Page)
router.get("/report", async (req, res) => {
  try {
    const customers = await Customer.find();
    const collectors = await Collector.find();

    const totalCustomers = customers.length;

    const totalRecovered = customers.reduce((sum, c) => sum + c.totalRecovered, 0);
    const totalLoan = customers.reduce((sum, c) => sum + c.loanAmount, 0);
    const totalPending = totalLoan - totalRecovered;

    const paidCustomers = customers.filter(c => c.remainingAmount === 0).length;
    const pendingCustomers = customers.filter(c => c.remainingAmount > 0).length;

    // Today's collection (today's date)
    const today = new Date().toLocaleDateString("en-IN");
    const todayCollection = customers
      .filter(c => c.lastPaidDate === today)
      .reduce((sum, c) => sum + (c.lastPaidAmount || 0), 0);

    res.json({
      totalCustomers,
      totalRecovered,
      totalPending,
      paidCustomers,
      pendingCustomers,
      todayCollection
    });

  } catch (err) {
    res.status(500).json({ message: "Error generating report", error: err.message });
  }
});


import multer from "multer";
import XLSX from "xlsx";

// Multer setup for file upload
const upload = multer({ storage: multer.memoryStorage() });

// -------------------------------------------
//  📌 UPLOAD & IMPORT EXCEL CUSTOMER DATA
// -------------------------------------------
router.post("/upload-excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Read Excel Buffer
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    let importedCount = 0;

    for (const row of data) {
      // Excel columns expected:
      // name | phone | area | loanAmount | amountPaid | remainingAmount | dueDate | status

      await Customer.create({
        name: row.name,
        phone: row.phone,
        area: row.area,
        loanAmount: row.loanAmount,
        totalRecovered: row.amountPaid || 0,
        remainingAmount: row.remainingAmount,
        dueDate: row.dueDate,
        status: row.status,
      });

      importedCount++;
    }

    res.json({
      success: true,
      message: `${importedCount} customers imported successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Import failed",
      error: err.message,
    });
  }
});


// ADMIN LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: admin._id }, "secret123", {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

export default router;
