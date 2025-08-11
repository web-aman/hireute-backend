const mongoose = require("mongoose");

const JobBookingModel = mongoose.Schema(
    {
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        email: {
            type: String
        },
        phoneNumber: {
            type: String
        },
        jobId: {
            type: mongoose.Schema.Types.ObjectId
        },
        jobTitle: {
            type: String
        },
        jobLocation: {
            type: String
        },
        jobState: {
            type: String
        },
        bookingId: {
            type: String,
        },
        accountHolderName: {
            type: String,
        },
        accountNumber: {
            type: String,
        },
        bankName: {
            type: String,
        },
        bsbNumber: {
            type: String,
        },
        jobUserName: {
            type: String,
        },
        jobUserEmail: {
            type: String,
        },
        jobPostedBy: {
            type: mongoose.Schema.Types.ObjectId,
        },
        jobImg: {
            type: [String],
        },
        bookingStatus: {
            type: String
        },
        paymentStatus: {
            type: String
        },
        status: {
            type: String,
            default: "pending"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
        },
        uteId: {
            type: mongoose.Schema.Types.ObjectId
        },
        amount: {
            type: Number
        },
        isUteDispatch: {
            type: Boolean,
            default: false
        },
        bookingBy: {
            type: mongoose.Schema.Types.ObjectId
        },
        requestPrice: {
            type: Number
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("jobBooking", JobBookingModel);

