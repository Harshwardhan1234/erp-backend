import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./db.js";

// ROUTES
import testRoute from "./routes/testRoute.js";
import customerRoute from "./routes/customerRoute.js";
import collectorRoute from "./routes/collectorRoute.js";
import adminRoute from "./routes/adminRoute.js";
import excelRoute from "./routes/excelRoute.js";

// 🔹 ENV LOAD FIRST
dotenv.config();

const app = express();

// 🔹 CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔹 BODY PARSER
app.use(express.json());

// 🔹 CONNECT DB (ONLY ONCE)
connectDB();

// 🔹 ROUTES
app.use("/test", testRoute);
app.use("/customer", customerRoute);
app.use("/collector", collectorRoute);
app.use("/admin", adminRoute);
app.use("/excel", excelRoute);

// 🔹 ROOT CHECK
app.get("/", (req, res) => {
  res.send("ERP Server Running with MongoDB");
});

// 🔹 START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
