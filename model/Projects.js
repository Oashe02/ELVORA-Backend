import mongoose from "mongoose";
const { Schema } = mongoose;
// Define a schema for images with captions
const ImageSchema = new mongoose.Schema({
	url: { type: String, required: true },
	caption: { type: String },
});

const ImageObjectSchema = new mongoose.Schema({
	imageUrl: { type: [String], required: true }, // Support for multiple URLs per image
	title: { type: String },
	subtitle: { type: String },
});

const FourDFeaturePageProjectSchema = new mongoose.Schema({
	thumbnail: { type: [String], required: true },
	title: { type: String, required: true },
	videoUrl: { type: String },
	link: { type: String },
	buttonTitle: { type: String },
	images: { type: [ImageObjectSchema], default: [] }, // Array of image objects
});

// Define the schema for the homepage project
const HomepageProjectSchema = new mongoose.Schema({
	thumbnail: { type: [String], required: true },
	title: { type: String, required: true },
	subtitle: { type: String },
	buttonText: { type: String },
	link: { type: String },
	videoUrl: { type: String },
	images: { type: [String], default: [] }, // Simple array of image URLs
});

// Homepage product schema
const homepageProjectSchema = new mongoose.Schema({
	thumbnail: { type: [String], required: true },
	title: { type: String, required: true },
	subtitle: { type: String },
	buttonText: { type: String },
	link: { type: String },
	videoUrl: { type: String }, // Either a video URL...
	images: [String], // ...or multiple images
});

// Featured projects schema
const FeaturedProjectSchema = new mongoose.Schema({
	thumbnail: { type: [String], required: true },
	title: { type: String, required: true },
	subtitle: { type: String },
	buttonText: { type: String },
	link: { type: String },
	videoUrl: { type: String }, // Video URL required
});

// Projects schema with nested images and sub-images
const ProjectSchema = new mongoose.Schema({
	type: {
		type: String,
		enum: [
			'3D SCANNING',
			'Architectural',
			'Characters',
			'Decorations',
			'Display Models',
			'Defence Display Models',
			'Product Development',
			'Styrofoam',
			'Trophy',
		],
	},
	captions: String,
	thumbnail: { type: [String], required: true },
	images: [String], // Main images
});

// Main Projects schema with multiple types
const ProjectsSchema = new mongoose.Schema({
	type: {
		type: String,
		required: true,
		enum: ['homepage', 'featured', 'projects', 'fourDfeature', 'fourDhomepage'], // Ensuring only valid types
	},
	siteName: String,
	homepageProject: homepageProjectSchema, // Used if type is 'homepage'
	featuredProject: FeaturedProjectSchema, // Used if type is 'featured'
	project: ProjectSchema, // Used if type is 'projects'
	fourDfeature: FourDFeaturePageProjectSchema, // New schema for 'fourDfeature' type
	fourDhomepage: HomepageProjectSchema, // New schema for 'fourDfeature' type
});

const Projects = mongoose.model('Projects', ProjectsSchema);

export default  Projects;
