import mongoose from "mongoose";
const { Schema } = mongoose;

// CarModel schema
const CarModelSchema = new Schema(
	{
		// Basic identity
		name: { type: String, required: true },
		slug: { type: String, required: true, unique: true },
		shortDescription: { type: String, required: true },
		description: { type: String, required: true },
		thumbnail: { type: String, required: true },
		establishedYear: { type: Number },

		// Relations
		make: {
			type: Schema.Types.ObjectId,
			ref: 'makes',
			required: true,
		},
		manufacturer: {
			type: Schema.Types.ObjectId,
			ref: 'manufacturers',
		},

		// Vehicle specifications
		year: { type: Number },
		bodyType: { type: String }, // e.g., Sedan, SUV, Hatchback
		engine: {
			displacement: { type: String }, // e.g., "2.0L"
			cylinders: { type: Number },
			type: { type: String }, // e.g., "Inline-4", "V6"
			horsepower: { type: Number },
			torque: { type: Number }, // in Nm or lb-ft
		},
		transmission: { type: String }, // e.g., "6-Speed Manual", "8-Speed Automatic"
		drivetrain: { type: String }, // e.g., "FWD", "RWD", "AWD"

		dimensions: {
			length: { type: Number }, // in mm or inches
			width: { type: Number },
			height: { type: Number },
			wheelbase: { type: Number },
		},
		weight: { type: Number }, // curb weight in kg or lbs
		fuelType: { type: String }, // e.g., "Petrol", "Diesel", "Electric"
		fuelCapacity: { type: Number }, // in liters or gallons

		price: { type: Number }, // base MSRP or starting price

		features: [{ type: String }], // e.g., ["Sunroof", "Leather Seats", ...]
		colorsAvailable: [{ type: String }],

		// Media assets
		images: [{ type: String }],
		videos: [{ type: String }],
		specSheet: { type: String }, // URL to downloadable PDF or spec document

		// Business metadata
		industry: { type: String }, // e.g., "Automotive"
		tags: [{ type: String }], // keywords for filtering/search

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
const CarModel = mongoose.model('carmodels', CarModelSchema);

export default CarModel;
