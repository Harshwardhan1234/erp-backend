import jwt from "jsonwebtoken";
import Collector from "../models/Collector.js";

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, "secret123");

    // ONLY COLLECTOR AUTH (for now)
    const collector = await Collector.findById(decoded.id);
    if (!collector) {
      return res.status(401).json({ message: "Collector not found" });
    }

    req.collector = collector; // 🔥 THIS IS KEY
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default auth;
