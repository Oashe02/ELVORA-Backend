const { validationResult } = require('express-validator');
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const secret = process.env.SECRET;
const jwt = require('jsonwebtoken');
const signIn = async (req, res) => {
	try {
		console.log({ body: req.body });
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors.array());
			return res.json({
				error: true,
				message: `${errors.array()[0].msg} ${errors.array()[0].param}`,
			});
		}

		let { email, password } = req.body;
		console.log({
			email,
			password,
		});

		const user = await User.findOne({ email });
		if (!user)
			return res.json({
				error: true,
				message: 'No user found with the provided email address',
			});

		// MATCH USER ENRCYPTED PASSWORD
		const isMatched = await bcrypt.compare(password, user.password);
		if (!isMatched)
			return res.json({
				error: true,
				message: 'Password does not matched',
			});
		if (user.isBanned)
			return res.json({
				error: true,
				message: 'Please contact admin, your account is disabled.',
			});

		//PASSWORD MATCHED
		const data = {
			email: user.email,
			_id: user._id,
			userName: user.userName,
			avatar: user.avatar,
		};
		// JWT TOKEN SIGN
		const token = jwt.sign(data, secret, {
			expiresIn: '20d',
		});
		const userUpdated = await User.findOneAndUpdate(
			{
				_id: user._id,
			},
			{
				lastSeen: new Date(),
			}
		);
		return res.json({
			error: false,
			message: 'Signin Successfully',
			token: token,
		});
	} catch (error) {
		console.log(error);
		return res.json({
			error: true,
			message: 'Something wents wrong, Please try after sometime',
		});
	}
};
const signUp = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors.array());
			return res.json({ error: true, message: errors.array()[0].msg });
		}

		const { userName, email, password } = req.body;

		console.log(req.body);
		const isUserNameAlreadyUsed = await User.findOne({
			userName,
		});
		if (isUserNameAlreadyUsed)
			return res.json({
				error: true,
				message: `${userName} is already taken, please choose another name`,
			});
		const isEmailAlreadyuser = await User.findOne({
			email,
		});
		if (isEmailAlreadyuser)
			return res.json({
				error: true,
				message: `${email} is already taken, please provide another email`,
			});
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(password, salt);
		let user = await new User({
			password: hash,
			userName: userName,
			email: email,
			isActive: true,
			avatar: `https://robohash.org/${userName}.png`,
		}).save();

		console.log(user);

		return res.json({
			message: 'Account Created successfully, please Login to continue',
		});
	} catch (error) {
		console.log({ error });
		return res.json({
			error: true,
			message: 'Something wents wrong, Please try after sometime',
		});
	}
};
const getProfile = async (req, res) => {
	try {
		console.log({
			profile: req.user,
		});

		const profile = await User.findOne({ _id: req.user._id });
		return res.json({
			error: true,
			message: 'profile',
			payload: profile,
		});
	} catch (error) {
		console.log({ error });
		return res.json({
			error: true,
			message: 'Something wents wrong, Please try after sometime',
		});
	}
};

module.exports = {
	signIn,
	signUp,
	getProfile,
};
