const mongoose = require("mongoose");

const UteModel = mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    description: {
      type: String,
    },
    licenceNumber: {
      type: String,
    },
    licenceExpireDate: {
      type: String,
    },
    serviceCity: {
      type: String,
    },
    location: {
      type: String,
    },
    state: {
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
    completeStep: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
    },
    seat: {
      type: String,
    },
    weight: {
      type: String,
    },
    weightUnit: {
      type: String,
    },
    isBooked: {
      type: Boolean
    },
    longitude: {
      type: String,
    },
    latitude: {
      type: String,
    },
    liked: {
      type: Boolean,
      default: false
    },
    likedBy: {
      type: [mongoose.Schema.Types.ObjectId],
    },
    views: {
      type: Number
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    priceType:{
      type: String
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    noOfUteOffer:{
      type:Number,
      default:0
    },
    isUteAvailable: {
      type: Boolean,
      default: true
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ute", UteModel);
