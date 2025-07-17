import mongoose from "mongoose";
const { Schema } = mongoose;

// Category schema
const CategorySchema = new Schema(
	{
		name: { type: String, required: true },
		slug: { type: String, required: true, unique: true },
		shortDescription: { type: String, required: true },
		description: { type: String, required: true },
		thumbnail: { type: String, required: true },
		images: [{ type: String }],
		videos: [{ type: String }],
		priority: { type: Number, default: 0 },
		status: {
			type: String,
			enum: ['active', 'draft', 'unpublished'],
			default: 'draft',
		},
	},
	{ timestamps: true }
);

// Export the model
const Category = mongoose.model('categories', CategorySchema);

export default Category;
