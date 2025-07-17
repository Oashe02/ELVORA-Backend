const express = require('express');
const router = express.Router();
const enquiryController = require('../controller/enquiry');

const { body, validationResult } = require('express-validator');
const passport = require('passport');
router.post(
	'/create',
	body('name').notEmpty().withMessage('Name is required'),
	body('phoneNumber').notEmpty().withMessage('Phone number is required'),
	body('email').isEmail().withMessage('Invalid email address'),
	// body('message').notEmpty().withMessage('Message is required'),
	// body('siteName').isIn(['3d', '4d']).withMessage('Invalid siteName'),
	enquiryController.createEnquiry
);
router.post(
	'/update/:id',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.updateEnquiry
);
router.get(
	'/all/:siteName',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.getAllEnquiry
);
router.get(
	'/single/:id',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.getSingleEnquiry
);
router.delete(
	'/delete/:id',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.deleteEnquiry
);

router.put(
	'/assign',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.attachEnquiryToPerson
);
router.put(
	'/change-status',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.changeStatus
);

router.post(
	'/:id/comment',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.addComment
);

router.delete(
	'/:enquiryId/comment/:commentId',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.deleteComment
);
router.put(
	'/quoation-update/:id',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.updateQuotation
);
router.put(
	'/remark/:id',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.updateRemark
);
router.put(
	'/estimated-value/:id',
	passport.authenticate('user-rule', { session: false }),
	enquiryController.updatedEstimatedValue
);

export default router;

