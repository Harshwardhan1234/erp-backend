import express from "express";
import connectDB from "./db.js";
import testRoute from "./routes/testRoute.js";
import customerRoute from "./routes/customerRoute.js";
import collectorRoute from "./routes/collectorRoute.js";
import adminRoute from "./routes/adminRoute.js";




const app = express();

// Body parser
app.use(express.json());

// Connect MongoDB
connectDB();

app.use("/test", testRoute);
app.use("/customer", customerRoute);
app.use("/collector", collectorRoute);
app.use("/admin", adminRoute);


// Test route
app.get("/", (req, res) => {
  res.send("ERP Server Running with MongoDB");
});

// Start server
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
