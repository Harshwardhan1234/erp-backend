import jwt from "jsonwebtoken";
import Collector from "../models/Collector.js";

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({ success: false, message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, "secret123");
    req.collector = await Collector.findById(decoded.id);

    if (!req.collector) {
      return res.status(401).json({ success: false, message: "Collector not found" });
    }

    next();

  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default auth;
