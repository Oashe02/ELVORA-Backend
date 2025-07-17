import mongoose from "mongoose";
const { Schema } = mongoose;

const FeedPostSchema = new Schema(
	{
		caption: { type: String, required: true },
		slug: { type: String, unique: true ,sparse: true},
		media: [
			{
				url: { type: String, required: true },
				type: { type: String, enum: ['image', 'video'], required: true },
			},
		],
		tags: [{ type: String }],
		status: {
			type: String,
			enum: ['active', 'draft', 'archived'],
			default: 'draft',
		},
		createdBy: { type: String, required: true }, // Can be updated to ObjectId if referencing a User model
		likes: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

const FeedPost = mongoose.model('feedposts', FeedPostSchema);

export default FeedPost;
