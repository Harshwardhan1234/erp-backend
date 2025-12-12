import express from "express";
import connectDB from "./db.js";
import testRoute from "./routes/testRoute.js";
import customerRoute from "./routes/customerRoute.js";
import collectorRoute from "./routes/collectorRoute.js";
import adminRoute from "./routes/adminRoute.js";
import cors from "cors";
import excelRoute from "./routes/excelRoute.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// CORS FIX
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

// Body parser
app.use(express.json());

// Connect MongoDB
connectDB();
connectDB(process.env.MONGO_URI);

// Routes
app.use("/test", testRoute);
app.use("/customer", customerRoute);
app.use("/collector", collectorRoute);
app.use("/admin", adminRoute);
app.use("/excel", excelRoute);

// Test route
app.get("/", (req, res) => {
  res.send("ERP Server Running with MongoDB");
});

// ⭐⭐ THIS IS THE FIX ⭐⭐
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
