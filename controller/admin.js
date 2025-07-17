const bcrypt = require('bcryptjs');
const User = require('../model/User');

// Create a new user
export const createUser = async (req, res) => {
	try {
		const { userName, email, role, avatar, access, isActive, password } =
			req.body;

		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = new User({
			avatar,
			access,
			userName,
			email,
			role,
			isActive,
			password: hashedPassword,
		});

		await newUser.save();
		res.status(201).json({ message: 'User created successfully', newUser });
	} catch (error) {
		res
			.status(500)
			.json({ error: 'Error creating user', details: error.message });
	}
};

// Edit user (except password)
export const editUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { userName, email, role, avatar, access, isActive, isBanned } =
			req.body;

		const updatedUser = await User.findByIdAndUpdate(
			id,
			{ userName, email, role, isActive, isBanned, avatar, access },
			{ new: true }
		);

		if (!updatedUser)
			return res.status(404).json({ message: 'User not found' });

		res.status(200).json({ message: 'User updated successfully', updatedUser });
	} catch (error) {
		res
			.status(500)
			.json({ error: 'Error updating user', details: error.message });
	}
};
export const editRole = async (req, res) => {
	try {
		const { role, userId } = req.body;
		console.log({ ROLE: req.user.role });

		const updatedUser = await User.findByIdAndUpdate(
			{ _id: userId },
			{ role },
			{ new: true }
		);

		if (!updatedUser)
			return res.status(404).json({ message: 'User not found' });

		res.status(200).json({ message: 'User updated successfully', updatedUser });
	} catch (error) {
		res
			.status(500)
			.json({ error: 'Error updating user', details: error.message });
	}
};

// Reset user password
export const resetPassword = async (req, res) => {
	try {
		const { id } = req.params;
		const { newPassword } = req.body;

		const hashedPassword = await bcrypt.hash(newPassword, 10);

		const updatedUser = await User.findByIdAndUpdate(
			id,
			{ password: hashedPassword },
			{ new: true }
		);

		if (!updatedUser)
			return res.status(404).json({ message: 'User not found' });

		res.status(200).json({ message: 'Password reset successfully' });
	} catch (error) {
		res
			.status(500)
			.json({ error: 'Error resetting password', details: error.message });
	}
};

// Delete user
export const deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		const deletedUser = await User.findByIdAndDelete(id);

		if (!deletedUser)
			return res.status(404).json({ message: 'User not found' });

		res.status(200).json({ message: 'User deleted successfully' });
	} catch (error) {
		res
			.status(500)
			.json({ error: 'Error deleting user', details: error.message });
	}
};

// Block/Unblock user
export const blockUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { isBanned } = req.body; // true to block, false to unblock

		const updatedUser = await User.findByIdAndUpdate(
			id,
			{ isBanned },
			{ new: true }
		);

		if (!updatedUser)
			return res.status(404).json({ message: 'User not found' });

		const status = isBanned ? 'blocked' : 'unblocked';
		res.status(200).json({ message: `User successfully ${status}` });
	} catch (error) {
		res.status(500).json({
			error: 'Error blocking/unblocking user',
			details: error.message,
		});
	}
};

export const getAllUsers = async (req, res) => {
	try {
		// Default pagination values if not provided in query
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		// Aggregation pipeline to fetch users without password
		const users = await User.aggregate([
			// {
			// 	$match: {
			// 		siteName: req.params.siteName,
			// 	},
			// },
			{
				$project: {
					userName: 1,
					email: 1,
					avatar: 1,
					role: 1,
					isActive: 1,
					isBanned: 1,
					lastSeen: 1,
					createdAt: 1,
					updatedAt: 1,
					access: 1,
				},
			},
			{ $sort: { createdAt: -1 } }, // Sort by latest created
			{ $skip: skip }, // Skip documents for pagination
			{ $limit: limit }, // Limit the number of documents to 'limit'
		]);

		// Total count of users (for pagination metadata)
		const totalUsers = await User.countDocuments();

		res.json({
			error: false,
			message: 'Users fetched successfully',
			payload: {
				docs: users,
				currentPage: page,
				totalPages: Math.ceil(totalUsers / limit),
				totalUsers,
				hasNextPage: page * limit < totalUsers,
				hasPrevPage: page > 1,
			},
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: true,
			message: 'Something went wrong. Please try again later.',
		});
	}
};
