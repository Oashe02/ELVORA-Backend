import User from "../model/User.js";
import OTP from "../model/Otp.js";
import Profile from "../model/Profile.js";
import { randomInt } from "crypto";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { sendEmail } from "../lib/resendMail.mjs";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
	try {
		const { idToken } = req.body;
		if (!idToken) {
			return res.status(400).json({ error: "ID token is required" });
		}

		// verify with Google
		const ticket = await client.verifyIdToken({
			idToken,
			audience: process.env.GOOGLE_CLIENT_ID,
		});
		const payload = ticket.getPayload();
		if (!payload?.email) {
			return res.status(400).json({ error: "Invalid Google login" });
		}

		// find or create user
		let user = await User.findOne({ email: payload.email });
		if (!user) {
			user = await User.create({
				email: payload.email,
				googleId: payload.sub,
				role: "user",
			});
			await Profile.create({ user: user._id });
		}

		// issue JWT
		const token = jwt.sign(
			{
				id: user._id,
				role: user.role,
				email: user.email,
			},
			process.env.SECRET,
			{ expiresIn: "7d" }
		);

		// set cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			path: "/",
		});

		return res.json({ ok: true, token });
	} catch (err) {
		console.error("googleLogin error:", err);
		return res
			.status(500)
			.json({ error: err.message || "Google login failed" });
	}
};



export const requestOtp = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}

		// generate code: fixed in test, random otherwise
		const code =
			process.env.NODE_ENV === "development"
				? "123456"
				: randomInt(100000, 999999).toString();

		const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
		await OTP.deleteMany({ email });
		// save to DB
		await OTP.create({ email, code, expiresAt });

		const emailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Your Login Code</title>
	<style>
		body {
			margin: 0;
			padding: 0;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
			background-color: #f8f9fa;
			line-height: 1.6;
		}
		.email-container {
			max-width: 600px;
			margin: 0 auto;
			background-color: #ffffff;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		}
		.header {
			background: linear-gradient(135deg, #000000 0%, #333333 100%);
			padding: 40px 30px;
			text-align: center;
		}
		.logo {
			color: #ffffff;
			font-size: 28px;
			font-weight: bold;
			margin: 0;
			letter-spacing: -0.5px;
		}
		.tagline {
			color: #cccccc;
			font-size: 14px;
			margin: 8px 0 0 0;
		}
		.content {
			padding: 50px 30px;
			text-align: center;
		}
		.message {
			font-size: 16px;
			color: #666666;
			margin: 0 0 40px 0;
			line-height: 1.5;
		}
		.otp-container {
			background-color: #f8f9fa;
			border: 2px dashed #e9ecef;
			border-radius: 12px;
			padding: 30px;
			margin: 0 0 40px 0;
		}
		.otp-label {
			font-size: 14px;
			color: #666666;
			margin: 0 0 10px 0;
			text-transform: uppercase;
			letter-spacing: 1px;
			font-weight: 500;
		}
		.otp-code {
			font-size: 36px;
			font-weight: bold;
			color: #000000;
			letter-spacing: 8px;
			font-family: 'Courier New', monospace;
			margin: 0;
			text-align: center;
		}
		.security-info {
			background-color: #fff3cd;
			border-left: 4px solid #ffc107;
			padding: 20px;
			margin: 30px 0;
			border-radius: 0 8px 8px 0;
		}
		.security-title {
			font-size: 16px;
			font-weight: 600;
			color: #856404;
			margin: 0 0 8px 0;
			display: flex;
			align-items: center;
		}
		.security-text {
			font-size: 14px;
			color: #856404;
			margin: 0;
		}
		.expiry-info {
			background-color: #f8f9fa;
			padding: 20px;
			border-radius: 8px;
			margin: 30px 0;
		}
		.expiry-text {
			font-size: 14px;
			color: #666666;
			margin: 0;
			text-align: center;
		}
		.footer {
			background-color: #f8f9fa;
			padding: 30px;
			text-align: center;
			border-top: 1px solid #e9ecef;
		}
		.footer-text {
			font-size: 12px;
			color: #999999;
			margin: 0 0 10px 0;
		}
		.support-link {
			color: #000000;
			text-decoration: none;
			font-weight: 500;
		}
		.support-link:hover {
			text-decoration: underline;
		}
		@media only screen and (max-width: 600px) {
			.email-container {
				margin: 0;
				box-shadow: none;
			}
			.header, .content, .footer {
				padding: 30px 20px;
			}
			.otp-code {
				font-size: 28px;
				letter-spacing: 4px;
			}
		}
	</style>
</head>
<body>
	<div class="email-container">
		<!-- Header -->
		<div class="header">
			<h1 class="logo">Perfum.com</h1>
			<p class="tagline">Secure Login Verification</p>
		</div>

		<!-- Main Content -->
		<div class="content">
			<p class="message">
				We received a request to log in to your Perfum.com account. Use the verification code below to complete your login.
			</p>

			<!-- OTP Code Section -->
			<div class="otp-container">
				<p class="otp-label">Your Login Code</p>
				<p class="otp-code">${code}</p>
			</div>

			<!-- Security Warning -->
			<div class="security-info">
				<p class="security-title">
					🔒 Security Notice
				</p>
				<p class="security-text">
					Never share this code with anyone. Our team will never ask for your login code.
				</p>
			</div>

			<!-- Expiry Information -->
			<div class="expiry-info">
				<p class="expiry-text">
					⏰ This code will expire in <strong>15 minutes</strong> for your security.
				</p>
			</div>
		</div>

		<!-- Footer -->
		<div class="footer">
			<p class="footer-text">
				Didn't request this code? Please ignore this email or 
				<a href="https://Perfum.com" class="support-link">contact our support team</a>.
			</p>
			<p class="footer-text">
				© 2025 Perfum.com. All rights reserved.
			</p>
		</div>
	</div>
</body>
</html>
`;


		// send email with enhanced template
		await sendEmail({
			to: email,
			subject: "🔐 Your Login Code - Expires in 15 minutes",
			html: emailTemplate,
		});

		return res.json({ ok: true });
	} catch (err) {
		console.error("requestOtp error:", err);
		return res.status(500).json({ error: err.message || "Failed to send OTP" });
	}
};
export const verifyOtp = async (req, res) => {
	try {
		const { email, code } = req.body;
		if (!email || !code) {
			return res.status(400).json({ error: "Email and code are required" });
		}

		// look up OTP
		const otp = await OTP.findOne({ email, code });
		console.log(otp);
		if (!otp || otp.expiresAt < new Date()) {
			return res.status(400).json({ error: "Invalid or expired code" });
		}

		// clean up used codes
		await OTP.deleteMany({ email });

		// find or create user & profile
		let user = await User.findOne({ email });
		if (!user) {
			user = await User.create({ email, role: "user" });
			await Profile.create({ user: user._id });
		}

		// issue JWT
		const token = jwt.sign(
			{
				id: user._id,
				role: user.role,
				email: user.email,
			},
			process.env.SECRET,
			{ expiresIn: "7d" }
		);

		// set cookie (requires cookie-parser or built-in support)
		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			path: "/",
		});

		return res.json({ ok: true, token });
	} catch (err) {
		console.error("verifyOtp error:", err);
		return res
			.status(500)
			.json({ error: err.message || "Failed to verify OTP" });
	}
};
export const updateProfile = async (req, res) => {
	try {
		const {
			firstName,
			lastName,
			address,
			apartment,
			city,
			emirate,
			profilePicture,
			country,
			phone,
		} = req.body;
		const profile = await Profile.findOneAndUpdate(
			{ user: req.user._id },
			{
				firstName,
				lastName,
				address,
				apartment,
				city,
				emirate,
				country,
				phone,
				profilePicture,
			},
			{ new: true, runValidators: true }
		);

		return res.json({
			error: false,
			message: "Profile updated successfully",
			profile,
		});
	} catch (err) {
		console.error("verifyOtp error:", err);
		return res
			.status(500)
			.json({ error: err.message || "Failed to verify OTP" });
	}
};

export const getProfile = async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user._id })
			.select("-__v -_id -createdAt -updatedAt")
			.lean();

		if (!profile) {
			const newProfile = await Profile.create({
				user: req.user._id,
				firstName: "",
				lastName: "",
				phone: "",
			});
			return res.json({
				ok: true,
				profile: {
					firstName: newProfile.firstName,
					lastName: newProfile.lastName,
					phone: newProfile.phone,
					address: newProfile.address,
					apartment: newProfile.apartment,
					city: newProfile.city,
					emirate: newProfile.emirate,
					country: newProfile.country,
					profilePicture: newProfile.profilePicture,
				},
			});
		}

		return res.json({ ok: true, profile });
	} catch (err) {
		console.error("getProfile error:", err);
		return res.status(500).json({
			error: "Failed to fetch profile",
			...(process.env.NODE_ENV === "development" && { details: err.message }),
		});
	}
};
