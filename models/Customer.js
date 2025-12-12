import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  area: { type: String, required: true },

  loanAmount: { type: Number, required: true },

  amountPaid: { type: Number, default: 0 },

  remainingAmount: {
    type: Number,
    default: function () {
      return this.loanAmount - this.amountPaid;
    }
  },

  dueDate: { type: Date, required: true },

  status: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending",
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collector",
    default: null,
  },

  paymentHistory: [
    {
      paidAmount: Number,
      date: { type: Date, default: Date.now }
    }
  ]
});

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
