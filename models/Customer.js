import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  area: String,

  loanType: { type: String, default: "Personal Loan" },

  loanAmount: Number,
  amountPaid: { type: Number, default: 0 },
  remainingAmount: Number,

  dueDate: Date,
  dpd: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending"
  },

  assignedCollector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collector",
    default: null
  },

  paymentHistory: [
    {
      amount: Number,
      mode: String,
      reference: String,
      date: { type: Date, default: Date.now }
    }
  ],

  visitStatus: {
    type: String,
    enum: ["not_visited", "visited", "not_found", "shifted"],
    default: "not_visited"
  },

  notes: String
}, { timestamps: true });

export default mongoose.model("Customer", customerSchema);
