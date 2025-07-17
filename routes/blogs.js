const express = require('express');
const router = express.Router();
const groupController = require('../controller/blogs');

const { body, validationResult } = require('express-validator');
const passport = require('passport');

router.get('/public-all/:siteName', groupController.getAllPublicBlog);
router.get('/public-single/:slug', groupController.getSingleBlog);
router.get(
	'/all/:siteName',
	passport.authenticate('user-rule', { session: false }),
	groupController.getAllBlog
);
router.get(
	'/single/:slug',
	passport.authenticate('user-rule', { session: false }),
	groupController.getAdminSingle
);
// router.get(
// 	'/single/:slug',
// 	passport.authenticate('user-rule', { session: false }),
// 	groupController.getAdminSingle
// );
router.post(
	'/create',
	[body('name').trim().exists().withMessage('Blog Name is Required')],
	passport.authenticate('user-rule', { session: false }),
	groupController.createBlog
);
router.post(
	'/edit/:id',
	[
		body('title').trim().exists().withMessage('Title is required'),
		body('subtitle').trim().optional(),
		body('tags').isArray().withMessage('Tags must be an array').optional(),
		body('mainTag').trim().optional(),
		body('videoUrl').trim().optional(),
		body('thumbnailUrl').trim().optional(),
		body('mainImageUrl').trim().optional(),
		body('blogContent').trim().optional(),
	],
	passport.authenticate('user-rule', { session: false }),
	groupController.editBlog
);
router.delete(
	'/delete/:id',
	passport.authenticate('user-rule', { session: false }),
	groupController.deleteBlog
);
router.post(
	'/publish/:id',
	passport.authenticate('user-rule', { session: false }),
	groupController.publishBlog
);
router.post('/add-comment/:id', groupController.addComment);

router.post(
	'/approve-comment/:blogId/:commentId',
	passport.authenticate('user-rule', { session: false }),
	groupController.approveComment
);

// Route to delete a comment by its ID with authentication
router.delete(
	'/delete-comment/:blogId/:commentId',
	passport.authenticate('user-rule', { session: false }),
	groupController.deleteComment
);

export default router;

