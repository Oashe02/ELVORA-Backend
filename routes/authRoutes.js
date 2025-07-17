import express from "express";
import {
	googleLogin,
	requestOtp,
	verifyOtp,
	updateProfile,
	getProfile,
  } from "../controller/authController.js";
import  passport from "passport";

const router = express.Router();

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);
router.post('/request-otp', requestOtp);
router.post('/google', googleLogin);
router.get(
	'/profile',
	passport.authenticate('user-rule', { session: false }),
	getProfile
);
router.post(
	'/update-profile',
	passport.authenticate('user-rule', { session: false }),
	updateProfile
);

export default router;
