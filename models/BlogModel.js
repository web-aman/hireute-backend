const { default: mongoose } = require("mongoose");

const Blog = mongoose.Schema(
	{
		title: {
			type: String,
		},
		description: {
			type: String,
		},
		views: { type: Number, default: 0 },
		comments: { type: Number },
		blogImg: {
			type: [String],
		},
		blogUser: {
			type: String,
		},
		liked :{
			type:mongoose.Schema.Types.ObjectId,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model("blogs", Blog);
