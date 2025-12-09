import express from "express";

const router = express.Router();

// GET request → http://localhost:5000/test/
router.get("/", (req, res) => {
  res.json({ message: "Test Route Working Fine 🔥" });
});

export default router;
