const mongoose = require("mongoose");

const JobModel = mongoose.Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    country: {
      type: String,
    },
    location: {
      type: String,
    },
    state: {
      type: String,
    },
    workSchedule: {
      type: [String],
    },
    budget: {
      type: String,
    },
    jobImg: {
      type: [String],
    },
    completeStep: {
      type: Number,
    },
    status: {
      type: String,
    },
    isBooked: {
      type: Boolean,
      default: false
    },
    jobUserId: {
      type: String,
    },
    liked:{
      type:Boolean,
      default:false
    },
    isApproved:{
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
    },
    longitude:{
      type: String,
    },
    latitude:{
      type: String,
    },
    views:{
      type:Number
    },
    noOfJobOffer:{
      type:Number,
      default:0
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

module.exports = mongoose.model("jobs", JobModel);
