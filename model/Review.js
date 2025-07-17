import mongoose from "mongoose";
const { Schema } = mongoose;
const ReviewSchema = new Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'products',
			required: true,
		},
		userId: {
			type: String,
			required: false,
		},
		userName: {
			type: String,
			required: true,
		},
		userEmail: {
			type: String,
			required: false,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		title: {
			type: String,
			required: true,
		},
		comment: {
			type: String,
			required: true,
		},
		images: {
			type: [String],
			default: [],
		},
		verified: {
			type: Boolean,
			default: false,
		},
		status: {
			type: String,
			enum: ['pending', 'approved', 'rejected'],
			default: 'pending',
		},
		helpful: {
			type: Number,
			default: 0,
		},
		color: {
			type: String,
			required: false,
		},
		size: {
			type: String,
			required: false,
		},
	},
	{
		timestamps: true,
	}
);

const Reviews = mongoose.model('reviews', ReviewSchema);

export default Reviews;
