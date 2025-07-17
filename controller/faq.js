const { validationResult } = require('express-validator');
const FAQ = require('../model/Faq.js');

// Create a new FAQ
export const createFAQ = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const faq = new FAQ(req.body);
		await faq.save();
		return res.json({ error: false, message: 'FAQ created', payload: faq });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
export const getAllPublicFaqs = async (req, res) => {
	try {
		const faq = await FAQ.find({
			siteName: req.params.siteName,
			isVisible: true,
		});

		return res.json({ error: false, message: 'FAQ', payload: faq });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Get all FAQs
// Get all FAQs with pagination and filtering by siteName
export const getAllFAQs = async (req, res) => {
	try {
		const { siteName } = req.params;
		const { page = 1, limit = 10 } = req.query; // Default page and limit
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);

		// Aggregation pipeline to filter by siteName and handle pagination
		const faqs = await FAQ.aggregate([
			{
				$match: { siteName }, // Filter by siteName
			},
			{
				$facet: {
					data: [
						{ $skip: (pageNum - 1) * limitNum }, // Skip for pagination
						{ $limit: limitNum }, // Limit the number of results
					],
					totalCount: [
						{ $count: 'count' }, // Get total count
					],
				},
			},
		]);

		// Extract total count or set to 0 if no data found
		const totalCount =
			faqs[0].totalCount.length > 0 ? faqs[0].totalCount[0].count : 0;

		// Respond with paginated FAQs
		return res.json({
			error: false,
			message: 'FAQs retrieved',
			payload: {
				docs: faqs[0].data,
				totalCount,
				page: pageNum,
				limit: limitNum,
				totalPages: Math.ceil(totalCount / limitNum),
			},
		});
	} catch (error) {
		return res.status(500).json({ error: true, message: error.message });
	}
};

// Get a single FAQ by ID
export const getFAQById = async (req, res) => {
	try {
		const faq = await FAQ.findById(req.params.id);
		if (!faq) {
			return res.status(404).json({ error: true, message: 'FAQ not found' });
		}
		res.json({ error: false, message: 'FAQ retrieved', payload: faq });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Update an FAQ by ID
export const updateFAQById = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!faq) {
			return res.status(404).json({ error: true, message: 'FAQ not found' });
		}
		res.json({ error: false, message: 'FAQ updated', payload: faq });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Delete an FAQ by ID
export const deleteFAQById = async (req, res) => {
	try {
		const faq = await FAQ.findByIdAndDelete(req.params.id);
		if (!faq) {
			return res.status(404).json({ error: true, message: 'FAQ not found' });
		}
		res.json({ error: false, message: 'FAQ deleted', payload: faq });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
