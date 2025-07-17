const Enquiry = require('../model/Enquiry');

const moment = require('moment'); // Ensure moment.js is installed

export const getUserEnquiryStats = async (req, res) => {
	try {
		const userId = req.user._id; // Assuming user info is stored in req.user

		// Aggregate the enquiries assigned to the logged-in user by status
		const stats = await Enquiry.aggregate([
			{
				$match: { assignedTo: userId }, // Filter by the logged-in user
			},
			{
				$group: {
					_id: '$status', // Group by status
					count: { $sum: 1 }, // Count the number of enquiries per status
				},
			},
			{
				$project: {
					status: '$_id', // Project status field
					count: 1, // Include count
					_id: 0, // Exclude default _id
				},
			},
		]);

		// Get the first and last enquiry dates
		const firstEnquiry = await Enquiry.findOne({ assignedTo: userId })
			.sort({ createdAt: 1 })
			.select('createdAt');
		const lastEnquiry = await Enquiry.findOne({ assignedTo: userId })
			.sort({ createdAt: -1 })
			.select('createdAt');

		const resolvedCount =
			stats.find((stat) => stat.status === 'resolved')?.count || 0;
		const previousResolvedCount = await Enquiry.countDocuments({
			assignedTo: userId,
			status: 'resolved',
			createdAt: {
				$gte: moment().subtract(1, 'months').startOf('month').toDate(),
				$lte: moment().subtract(1, 'months').endOf('month').toDate(),
			}, // Last month
		});

		const percentageIncrease =
			previousResolvedCount > 0
				? ((resolvedCount - previousResolvedCount) / previousResolvedCount) *
				  100
				: 0;

		return res.status(200).json({
			error: false,
			message: 'Enquiry statistics retrieved successfully.',
			data: stats, // This will be an array of objects with status and count
			resolvedCount, // Total resolved enquiries
			percentageIncrease: percentageIncrease.toFixed(2), // Round to two decimal places
			firstEnquiryDate: firstEnquiry?.createdAt, // First enquiry date
			lastEnquiryDate: lastEnquiry?.createdAt, // Last enquiry date
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			error: true,
			message: 'Internal server error.',
		});
	}
};
