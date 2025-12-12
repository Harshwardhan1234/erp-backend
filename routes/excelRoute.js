import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import Customer from "../models/Customer.js";

const router = express.Router();

// Multer config (to accept excel file)
const upload = multer({ storage: multer.memoryStorage() });

// API: Upload Excel
router.post("/upload", upload.single("excel"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Read excel buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    // Insert into DB
    const customers = await Customer.insertMany(jsonData);

    res.json({
      success: true,
      message: "Excel Imported Successfully",
      imported: customers.length,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Import failed",
      error: error.message,
    });
  }
});

export default router;
