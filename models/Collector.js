import mongoose from "mongoose";
import bcrypt from "bcryptjs";  // <-- ADD THIS

const collectorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  area: { type: String, required: true },
  assignedCustomers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer"
    }
  ]
});

// HASH PASSWORD BEFORE SAVE
collectorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// METHOD TO COMPARE PASSWORD DURING LOGIN
collectorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Collector = mongoose.model("Collector", collectorSchema);
export default Collector;
