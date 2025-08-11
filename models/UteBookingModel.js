// const mongoose = require("mongoose");

// const UteBookingModel = mongoose.Schema(
//   {
//     firstName:{
//         type:String
//     },
//     lastName :{
//         type:String
//     },
//     name:{
//         type:String
//     },
//     uteOwnerName :{ type:String},
//     uteOwnerEmail :{ type:String},
//     uteName :{
//         type:String   
//     },
//     email:{
//         type:String
//     },
//     phoneNumber:{
//         type:String
//     },
//     uteId:{
//         type:String
//     },
//     pickupAddress:{
//         type:String
//     },
//     dropAddress:{
//         type:String
//     },
//     budget:{
//         type:String
//     },
//     jobState:{
//         type:String
//     },
//     bookingId:{
//         type:String,
//     },
//     uteId:{
//         type:String
//     },
//     accountHolderName:{
//         type:String,
//     },
//     accountNumber:{
//         type:String,
//     },
//     bankName:{
//         type:String,
//     },
//     bsbNumber:{
//         type:String,
//     },
//     jobPostedBy:{
//         type:String,
//     },
//     uteImages: {
//         type: [String],
//     },
//     status:{
//         type:String,
//         default:"pending"
//     },
//     bookingStatus :{
//         type:String,

//     },
//     paymentStatus :{
//         type:String,

//     },
//     utePostedBy:{
//         type:String,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("uteBooking", UteBookingModel);

const mongoose = require("mongoose");
const { isReadable } = require("nodemailer/lib/xoauth2");

const UteBookingModel = mongoose.Schema(
    {
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        name: {
            type: String
        },
        uteOwnerName: { type: String },
        uteOwnerEmail: { type: String },
        uteName: {
            type: String
        },
        email: {
            type: String
        },
        phoneNumber: {
            type: String
        },
        uteId: {
            type: mongoose.Schema.Types.ObjectId
        },
        pickupAddress: {
            type: Object
        },
        dropAddress: {
            type: Object
        },
        budget: {
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
        jobPostedBy: {
            type: String,
        },
        uteImages: {
            type: [String],
        },
        status: {
            type: String,
            default: "pending"
        },
        bookingStatus: {
            type: String,
        },
        paymentStatus: {
            type: String,

        },
        utePostedBy: {
            type: mongoose.Schema.Types.ObjectId,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
        },
        isAvailable: {
            type: String,
            default: true
        },
        bookingBy: {
            type: mongoose.Schema.Types.ObjectId
        },
        amount: {
            type: Number
        },
        requestAmount: {
            type: Number
        },
        actualAmount: {
            type: Number
        },
        noOfUteOffer:{
            type:String
        },
        isUteDelivered: {
            type: Boolean,
            default: false
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

module.exports = mongoose.model("uteBooking", UteBookingModel);