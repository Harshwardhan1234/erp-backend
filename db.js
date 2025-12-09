import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://Harsherp:Harsh2003@cluster0.u2uudpm.mongodb.net/erp?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
  }
};

export default connectDB;
