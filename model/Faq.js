import mongoose from "mongoose";
const { Schema } = mongoose;

const FaqSchema = new Schema(
	{
		question: {
			type: String,
			required: true,
			trim: true,
		},
		answer: {
			type: String,
			required: true,
			trim: true,
		},
		// category: {
		// 	type: Schema.Types.ObjectId,
		// 	ref: 'faqcategories',
		// 	required: true,
		// },
		order: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		viewCount: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

const Faq = mongoose.model('faqs', FaqSchema);

export default Faq;
