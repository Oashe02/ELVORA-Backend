const { validationResult } = require('express-validator');
const { generateSlug } = require('../utils/utils');
const Newsletter = require('../model/Newsletter');

// Create a new newsletter
export const createNewsletter = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const newsletter = new Newsletter({
			...req.body,
			slug: generateSlug(req.body.title),
		});
		await newsletter.save();
		return res.json({
			error: false,
			message: 'newsletter',
			payload: newsletter,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Get all newsletters
export const getAllNewsletters = async (req, res) => {
	try {
		const { siteName } = req.params;
		const page = parseInt(req.query.page) || 1; // Default to page 1
		const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
		const skip = (page - 1) * limit;

		// Aggregation pipeline
		const aggregationPipeline = [
			{
				$match: { siteName }, // Match newsletters by siteName
			},
			{
				$facet: {
					data: [
						{ $skip: skip }, // Skip documents for pagination
						{ $limit: limit }, // Limit the number of results per page
					],
					totalCount: [
						{ $count: 'count' }, // Count the total documents matching the filter
					],
				},
			},
			{
				$project: {
					data: 1,
					total: { $arrayElemAt: ['$totalCount.count', 0] }, // Extract total count
				},
			},
		];

		const result = await Newsletter.aggregate(aggregationPipeline);
		const { data, total } = result[0];
		const totalPages = Math.ceil(total / limit);
		const totalnewsletter = await Newsletter.countDocuments({
			siteName: req.params.siteName,
		});
		return res.json({
			error: false,
			message: 'newsletters',
			payload: {
				docs: data,
				currentPage: page,
				totalPages: Math.ceil(totalnewsletter / limit), // Calculate total pages
				totalnewsletter, // Total number of reviews
				hasNextPage: page * limit < totalnewsletter, // Check if there's a next page
				hasPrevPage: page > 1, // Check if there's a previous page
			},
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
export const getAllPublicNewsletters = async (req, res) => {
	try {
		const { siteName } = req.params;
		const newsletter = await Newsletter.find({
			siteName,
		});
		return res.json({
			error: false,
			message: 'NewsLetter',
			payload: newsletter,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Get a single newsletter by ID
export const getNewsletterById = async (req, res) => {
	try {
		const newsletter = await Newsletter.findById(req.params.id);
		if (!newsletter) {
			return res.json({
				error: true,
				message: 'Newsletter not found',
			});
		}
		return res.json({
			error: false,
			message: 'newsletter',
			payload: newsletter,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Update a newsletter by ID
export const updateNewsletterById = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const newsletter = await Newsletter.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		);
		if (!newsletter) {
			return res.json({
				error: true,
				message: 'Newsletter not found',
			});
		}
		return res.json({
			error: false,
			message: 'newsletter',
			payload: newsletter,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Delete a newsletter by ID
export const deleteNewsletterById = async (req, res) => {
	try {
		const newsletter = await Newsletter.findByIdAndDelete(req.params.id);
		if (!newsletter) {
			return res.json({
				error: true,
				message: 'Newsletter not found',
			});
		}
		return res.json({
			error: false,
			message: 'newsletter',
			payload: newsletter,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
