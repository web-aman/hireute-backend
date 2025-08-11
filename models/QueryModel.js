const mongoose = require("mongoose");

const QuerySchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    message: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    replied: {
      type: Boolean,
      default: false,
    },
    replyMessage: {
      type: String,
    },
    replyDate: {
      type: Date,
    },
    isDeleted: {
			type: Boolean,
			default: false,
		},
  },
  {
    timestamps: true,
  }
);

const QueryModel = mongoose.model("Query", QuerySchema);

module.exports = QueryModel;
