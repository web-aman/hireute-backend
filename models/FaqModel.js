const { default: mongoose } = require("mongoose");

const Faq = mongoose.Schema(
	{
		question: {
			type: String,
		},
		answer: {
			type: String,
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

module.exports = mongoose.model("faq", Faq);
