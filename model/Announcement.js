import mongoose from "mongoose";
const { Schema } = mongoose;

// Announcement schema
const AnnouncementSchema = new Schema(
	{
		name: { type: String, required: true },
		slug: { type: String, required: true, unique: true },
		title: { type: String, required: true },
		description: { type: String, required: true },
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

// Create a slug from the name
AnnouncementSchema.pre('validate', function (next) {
	if (this.name && !this.slug) {
		this.slug = this.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	}
	next();
});

// Export the model
const Announcement = mongoose.model('announcements', AnnouncementSchema);
export default Announcement;
