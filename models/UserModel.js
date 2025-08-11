const { default: mongoose } = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    profileImg: {
      type: String,
    },
    coverImg: {
      type: String,
    },
    password: {
      type: String,
    },
    otp: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tokens: [
      {
        type: String,
      },
    ],
    token: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
    },
    location: {
      type: [String],
    },

    isActive: {
      type: Boolean,
      default: false,
    },
    bsbNumber: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    bankName: {
      type: String,
    },
    accountHolderName: {
      type: String,
    },
    isCompleteProfile: {
      type: Boolean,
    },
    jobPosted: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "Job",
    },
    utePosted: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "Ute",
    },
    favoriteUtes :{
      type:[ mongoose.Schema.Types.ObjectId],
    },
    favoriteJob :{
      type:[ mongoose.Schema.Types.ObjectId],
    },
    favoriteBlog : {
      type:[ mongoose.Schema.Types.ObjectId],
    },
    customer: {
      type: String
    },
    accountId: {
      type: String
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

module.exports = mongoose.model("users", UserSchema);
