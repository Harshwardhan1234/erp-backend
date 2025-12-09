import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },

  loanAmount: { type: Number, required: true }, // Total loan
  interest: { type: Number, required: true },
  dueDate: { type: Date, required: true },

  visitStatus: {
  type: String,
  enum: ["not_visited", "visited", "not_home", "wrong_address", "promised", "refused"],
  default: "not_visited"
},

promiseDate: {
  type: Date,
  default: null
},


  status: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending"
  },

  amountPaid: {
    type: Number,
    default: 0
  },

  remainingAmount: {
    type: Number,
    default: function () {
      return this.loanAmount;
    }
  },
  
  assignedTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Collector",
  default: null
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
