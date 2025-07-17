import mongoose from "mongoose";
const { Schema } = mongoose;

// Manufacturer schema
const ManufacturerSchema = new Schema(
	{
		// Basic identity
		name: { type: String, required: true },
		slug: { type: String, required: true, unique: true },
		shortDescription: { type: String, required: true },
		description: { type: String, required: true },
		thumbnail: { type: String, required: true },
		establishedYear: { type: Number },

		// Contact & location
		contact: {
			website: { type: String },
			email: { type: String },
			phone: { type: String },
			address: {
				street: { type: String },
				city: { type: String },
				state: { type: String },
				postalCode: { type: String },
				country: { type: String },
			},
		},

		// Media assets
		images: [{ type: String }],
		videos: [{ type: String }],
		brochure: { type: String },

		// Social & web presence
		socialLinks: {
			facebook: { type: String },
			instagram: { type: String },
			linkedin: { type: String },
			twitter: { type: String },
		},

		// Certifications & compliance
		certifications: [{ type: String }],
		compliance: [{ type: String }],

		// Business metadata
		industry: { type: String },
		tags: [{ type: String }],

		// Ratings
		rating: {
			average: { type: Number, default: 0 },
			count: { type: Number, default: 0 },
		},

		// SEO fields
		seo: {
			metaTitle: { type: String },
			metaDescription: { type: String },
			keywords: [{ type: String }],
		},

		// Relations
		products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
		distributors: [{ type: Schema.Types.ObjectId, ref: 'Dealer' }],

		// Priority & status
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
const Manufacturer = mongoose.model('manufacturers', ManufacturerSchema);

export default Manufacturer;
