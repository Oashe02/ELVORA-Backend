import mongoose from "mongoose";
const { Schema } = mongoose;

// Banner schema
const BannerSchema = new Schema(
	{
		name: { type: String, required: true },
		slug: { type: String, required: true, unique: true },
		title: { type: String, required: true },
		description: { type: String, required: true },
		thumbnail: { type: String, required: true },
		images: [{ type: String }],
		videos: [{ type: String }],
		url: { type: String, required: true },
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
const Banner = mongoose.model('banners', BannerSchema);

export default Banner;
