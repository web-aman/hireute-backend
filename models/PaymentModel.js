const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
    },
    paymentBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    customer: {
      type: String,
    },
    paymentIntentId: {
      type: String,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    sendMailBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    charges: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);


const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

module.exports = Payment;
