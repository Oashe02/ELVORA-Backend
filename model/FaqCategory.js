import mongoose from "mongoose";
const { generateSlug } = require('../utils/func');
const { Schema } = mongoose;

const FaqCategorySchema = new Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		description: {
			type: String,
			trim: true,
		},
		icon: {
			type: String,
			trim: true,
		},
		order: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		faqs: [
			{
				type: Schema.Types.ObjectId,
				ref: 'faqs',
			},
		],
	},
	{ timestamps: true }
);

// Create slug from title before saving
FaqCategorySchema.pre('save', function (next) {
	if (this.isModified('title')) {
		this.slug = generateSlug(this.title);
	}
	next();
});

const FaqCategory = mongoose.model('faqcategories', FaqCategorySchema);
export default FaqCategory;
