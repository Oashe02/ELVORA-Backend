import mongoose from "mongoose";
const { Schema } = mongoose;

// Contact schema
const ContactSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		message: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ['new', 'read', 'replied'],
			default: 'new',
		},
	},
	{ timestamps: true }
);

// Export the model
const Contact = mongoose.model('contacts', ContactSchema);

export default Contact;
