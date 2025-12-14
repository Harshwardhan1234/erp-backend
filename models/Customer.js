import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  paidAmount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
    },

    loanAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    remainingAmount: {
      type: Number,
      default: 0,
    },

    dueDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },

    visitStatus: {
      type: String,
      enum: [
        "not_visited",
        "visited",
        "not_home",
        "wrong_address",
        "promised",
      ],
      default: "not_visited",
    },

    promiseDate: {
      type: Date,
    },

    // 🔥 FINAL ASSIGNMENT FIELD (LOCKED)
    assignedCollector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collector",
      default: null,
    },

    paymentHistory: [paymentSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Customer", customerSchema);
