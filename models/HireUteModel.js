const mongoose = require("mongoose");

const UteModel = mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    description:{
      type:String
    },
    licenceNumber: {
      type: String,
    },

    licenceExpireDate: {
      type: String,
    },

    serviceCity: {
      type: [String],
    },

    location: {
      type: String,
    },

    uteModel: {
      type: String,
    },

    chesisNumber: {
      type: String,
    },

    uteAvailble: {
      type: [String],
    },
    uteImages: {
      type: [String],
    },
    budget: {
      type: String,
    },
    liked:{
      type:Boolean,
      default:false
    },
    completeStep: {
      type: Number,
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

module.exports = mongoose.model("ute", UteModel);
