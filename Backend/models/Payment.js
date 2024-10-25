const mongoose = require("mongoose");
const { Schema } = mongoose;
const PaymentSchema = new Schema(
  {
    productData: {
      type: Object,
    },
    userData: {
      type: Object,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    totalAmount: {
      type: Number,
    },
    paymentId: { type: String },
    createdAt: { type: Date, default: Date.now },
    currency: { type: String },
    email: { type: String },
    status: { type: String },
    amount: { type: Number },
    orderStatus: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("payment", PaymentSchema);
