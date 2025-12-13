import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const collectorSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: String,
  area: String
});

// HASH password
collectorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// COMPARE password
collectorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Collector", collectorSchema);
