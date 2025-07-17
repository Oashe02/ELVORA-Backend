import express from 'express';
import {
	listAllReviews,
	postReview,
	listProductReviews,
	getReview,
	updateReview,
	deleteReview,
	markHelpful,
} from '../controller/reviewController.js';
import passport from 'passport';
import isAdmin from '../middleware/isAdmin.js';


const router = express.Router();

// GET /api/reviews?page=&limit=&status=&productId=
// POST /api/reviews
router.get(
	'/',
	passport.authenticate('user-rule', { session: false }),
	// isAdmin,
	listAllReviews
);

router.get('/public', listAllReviews);

router.post(
	'/',
	passport.authenticate('user-rule', { session: false }),
	postReview
);

// GET /api/reviews/product/:id
router.get('/product/:id', listProductReviews);

// GET, PUT, DELETE, PATCH /api/reviews/:id
router
	.route('/:id')
	.get(getReview)
	.put(updateReview)
	.delete(deleteReview)
	.patch(markHelpful);

export default router;

