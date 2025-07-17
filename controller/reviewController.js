import  Reviews from '../model/Review.js';

async function checkVerifiedBuyer(userId, productId) {
	// TODO: replace with your real implementation (e.g. query Orders)
	// For now, always return true
	return true;
}

export const listAllReviews = async (req, res) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const { status, productId } = req.query;

		// Build filter object
		const filters = {};
		if (status) filters.status = status;
		if (productId) filters.productId = productId;

		// Count total documents matching filters
		const totalCount = await Reviews.countDocuments(filters);

		// Calculate pagination values
		const totalPages = Math.ceil(totalCount / limit);
		const skip = (page - 1) * limit;

		// Fetch paginated reviews
		const reviews = await Reviews.find(filters)
			.sort({ createdAt: -1 }) // optional: sort by most recent
			.skip(skip)
			.limit(limit)
			.lean()
			.exec();

		return res.json({
			reviews: reviews || [],
			totalPages: totalPages || 1,
			currentPage: page,
		});
	} catch (err) {
		console.error('listAllReviews error:', err);
		return res.status(500).json({ error: 'Failed to fetch reviews' });
	}
};

export const postReview = async (req, res) => {
	try {
		const user = req.user;
		if (!user) {
			return res.status(401).json({ error: 'Authentication required' });
		}
		// TODO find is he purchased the product or not

		const { productId, rating, title, comment } = req.body;
		if (!productId || !rating || !title || !comment) {
			return res.status(400).json({ error: 'Missing required fields' });
		}
		if (rating < 1 || rating > 5) {
			return res.status(400).json({ error: 'Rating must be between 1 and 5' });
		}

		const verified = await checkVerifiedBuyer(user.id, productId);
		if (!verified) {
			return res
				.status(403)
				.json({ error: 'Only verified buyers can submit reviews' });
		}

		const reviewData = {
			...req.body,
			userId: user.id,
			userName: user.name || 'Anonymous',
			userEmail: user.email || '',
			status: 'pending',
			verified: true,
		};
		console.log({ reviewData });

		const review = await new Reviews(reviewData).save();
		return res.status(201).json(review);
	} catch (err) {
		console.error('postReview error:', err);
		return res.status(500).json({ error: 'Failed to create review' });
	}
};

export const listProductReviews = async (req, res) => {
	try {
		const productId = req.params.id;
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const filterValue = req.query.filter; // e.g. a status or rating filter

		// Build base filter
		const queryFilters = { productId };

		// If a filter param was provided, assume it maps to some field on Reviews
		// For example, if you filter by “status”, use queryFilters.status = filterValue.
		// Adjust this line to match your schema’s fields.
		if (filterValue) {
			queryFilters.status = filterValue;
		}

		// Count total matching documents
		const totalCount = await Reviews.countDocuments(queryFilters);

		// Calculate total pages and how many to skip
		const totalPages = Math.ceil(totalCount / limit) || 1;
		const skip = (page - 1) * limit;

		// Fetch the paginated list
		const reviews = await Reviews.find(queryFilters)
			.sort({ createdAt: -1 }) // optional: sort by newest first
			.skip(skip)
			.limit(limit)
			.lean()
			.exec();

		return res.json({
			reviews: reviews || [],
			totalPages,
			currentPage: page,
		});
	} catch (err) {
		console.error('listProductReviews error:', err);
		return res.status(500).json({ error: 'Failed to fetch product reviews' });
	}
};

/**
 * Get a single review by its ID
 * GET /api/review/:id
 */
export const getReview = async (req, res) => {
	try {
		const reviewId = req.params.id;
		const review = await Reviews.findById(reviewId).lean();

		if (!review) {
			return res.status(404).json({ error: 'Reviews not found' });
		}

		return res.json(review);
	} catch (err) {
		console.error('getReview error:', err);
		return res.status(500).json({ error: 'Failed to fetch review' });
	}
};

/**
 * Update a review by ID
 * PUT /api/review/:id
 * Body may contain any updatable fields (e.g. { comment, rating, status, etc. })
 */
export const updateReview = async (req, res) => {
	try {
		const reviewId = req.params.id;
		// { new: true } returns the updated document
		const updatedReview = await Reviews.findByIdAndUpdate(reviewId, req.body, {
			new: true,
			runValidators: true,
		}).lean();

		if (!updatedReview) {
			return res.status(404).json({ error: 'Reviews not found' });
		}

		return res.json(updatedReview);
	} catch (err) {
		console.error('updateReview error:', err);
		return res.status(500).json({ error: 'Failed to update review' });
	}
};

/**
 * Delete a review by ID
 * DELETE /api/review/:id
 */
export const deleteReview = async (req, res) => {
	try {
		const reviewId = req.params.id;
		const deleted = await Reviews.findByIdAndDelete(reviewId).exec();

		if (!deleted) {
			return res.status(404).json({ error: 'Reviews not found' });
		}

		return res.json({ success: true });
	} catch (err) {
		console.error('deleteReview error:', err);
		return res.status(500).json({ error: 'Failed to delete review' });
	}
};

/**
 * Mark a review as “helpful”
 * POST /api/review/:id/helpful   (expects { action: 'helpful' } in body)
 * This increments a hypothetical `helpfulCount` field by 1.
 * Adjust this logic to match your actual schema (e.g., you may store an array of user IDs who marked helpful).
 */
export const markHelpful = async (req, res) => {
	try {
		const reviewId = req.params.id;
		if (req.body.action !== 'helpful') {
			return res.status(400).json({ error: 'Invalid action' });
		}

		// Example: increment a `helpfulCount` field by 1
		const updated = await Reviews.findByIdAndUpdate(
			reviewId,
			{ $inc: { helpfulCount: 1 } },
			{ new: true }
		).lean();

		if (!updated) {
			return res.status(404).json({ error: 'Reviews not found' });
		}

		return res.json(updated);
	} catch (err) {
		console.error('markHelpful error:', err);
		return res.status(500).json({ error: 'Failed to process request' });
	}
};
