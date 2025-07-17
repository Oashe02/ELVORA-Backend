import mongoose from "mongoose";
const { Schema } = mongoose;

// AddOn schema
const AddOnSchema = new Schema(
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
const AddOn = mongoose.model('addons', AddOnSchema);

export default AddOn;
