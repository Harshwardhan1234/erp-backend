import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const collectorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  area: { type: String, required: true },
}, { timestamps: true });

// HASH PASSWORD
collectorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// COMPARE PASSWORD
collectorSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("Collector", collectorSchema);
