const mongoose = require("mongoose");

const creditUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      default: 100,
      min: 0,
    },
    lastCreditReset: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CreditUser", creditUserSchema);
