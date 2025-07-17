const { validationResult } = require('express-validator');
const Enquiry = require('../model/Enquiry');
const User = require('../model/User');
const Customer = require('../model/Customer');
const { EnquiryStatus } = require('../utils/utils');
const sendMail = require('../helper/mail');
const { enquiryTemplate } = require('../template/enquiryTemplate');
import mongoose from "mongoose";

// Create a new enquiry
export const createEnquiry = async (req, res) => {
	// Handle validation results
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const enquiry = new Enquiry(req.body);
		const customer = new Customer(req.body).save();
		await enquiry.save();
		// console.log({ enquiry });

		return res.json({
			error: false,
			message: 'Enquiry Submitted',
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
export const updateEnquiry = async (req, res) => {
	// Handle validation results
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	// Extract ID from request parameters
	const { id } = req.params;

	// Validate the ID (optional but recommended)
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({
			message: 'Invalid blog ID format',
		});
	}

	try {
		const {
			name,
			email,
			phoneNumber,
			source,
			siteName,
			estimatedValue,
			quotation,
			message,
			remark,
			fileUrl,
		} = req.body;
		const enquiry = await Enquiry.findByIdAndUpdate(id, {
			name,
			email,
			phoneNumber,
			source,
			siteName,
			estimatedValue,
			quotation,
			message,
			remark,
			fileUrl,
		});

		return res.json({
			error: false,
			message: 'Enquiry Updated!',
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Get all enquiries
export const getAllEnquiry = async (req, res) => {
	try {
		const { siteName } = req.params;
		const { page = 1, limit = 10 } = req.query; // Default page to 1 and limit to 10 if not provided

		// Convert page and limit to integers
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);

		// MongoDB aggregation pipeline
		const enquiries = await Enquiry.aggregate([
			{
				$match: { siteName }, // Filter enquiries by siteName
			},
			{
				$sort: {
					createdAt: -1, // Sort by createdAt in descending order for new enquiries
				},
			},
			{
				$facet: {
					data: [
						{ $skip: (pageNum - 1) * limitNum }, // Skip documents for pagination
						{ $limit: limitNum }, // Limit the number of results per page
					],
					totalCount: [
						{ $count: 'count' }, // Count total documents for this query
					],
				},
			},
		]);

		// Ensure totalCount is returned or set to 0 if no data is found
		const totalCount =
			enquiries[0].totalCount.length > 0 ? enquiries[0].totalCount[0].count : 0;

		return res.json({
			error: false,
			message: 'enquiries',
			payload: {
				docs: enquiries[0].data,
				totalCount,
				page: pageNum,
				limit: limitNum,
				totalPages: Math.ceil(totalCount / limitNum),
				hasNextPage: page * limit < totalCount,
				hasPrevPage: page > 1,
			},
		});
	} catch (error) {
		return res.status(500).json({ error: true, message: error.message });
	}
};

export const getSingleEnquiry = async (req, res) => {
	try {
		const enquiry = await Enquiry.findOne({
			_id: req.params.id,
		})
			.populate({
				path: 'assignedTo',
				select: 'userName avatar email _id', // Select specific fields
			})
			.populate({
				path: 'changeHistory.changedBy',
				select: 'userName avatar email _id', // Populate changedBy in changeHistory
			})
			.populate({
				path: 'statusHistory.changedBy',
				select: 'userName avatar email _id', // Populate changedBy in statusHistory
			})
			.populate({
				path: 'comments.user',
				select: 'userName avatar email _id', // Populate changedBy in statusHistory
			});
		if (!enquiry)
			return res.json({
				error: true,
				message: 'No enquiry Found',
			});

		return res.json({
			error: false,
			message: 'enquiry Found',
			payload: enquiry,
		});
	} catch (error) {
		console.log(error);
		return res.json({
			error: true,
			message: 'Something wents wrong, Please try after sometime',
		});
	}
};

// Delete an enquiry by ID
export const deleteEnquiry = async (req, res) => {
	const { id } = req.params;

	try {
		const enquiry = await Enquiry.findByIdAndDelete(id);
		if (!enquiry) {
			return res.json({
				error: true,
				message: 'Something wents wrong, Please try after sometime',
			});
		}
		return res.json({
			error: false,
			message: 'Deleted',
			payload: enquiry,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export const attachEnquiryToPerson = async (req, res) => {
	try {
		const { enquiryId, userId } = req.body; // Get enquiryId and userId from route params
		const { _id: changedBy } = req.user; // User making the change
		console.log({
			enquiryId,
			userId,
			changedBy,
		});

		// Find the enquiry and user
		const enquiry = await Enquiry.findById(enquiryId);
		const user = await User.findById(userId);

		if (!enquiry) {
			return res.status(404).json({ message: 'Enquiry not found' });
		}
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Update enquiry with the assigned user
		enquiry.assignedTo = userId;
		enquiry.status = EnquiryStatus.ASSIGNED;

		// Add entry to change history
		enquiry.changeHistory.push({
			changedBy, // User making the change
			changes: `Enquiry assigned to ${user.userName}`,
			assignedToName: user.userName,
			assignedToID: user._id,
		});

		// TODO send mail....
		// Save the updated enquiry
		await enquiry.save();
		const subject = `New Enquiry Assigned: ${enquiry.name}`;
		// const message = `
		//   Hello ${user.userName},

		//   A new enquiry has been assigned to you.

		//   Enquiry Details:
		//   - Name: ${enquiry.name}
		//   - Email: ${enquiry.email}
		//   - Phone: ${enquiry.phoneNumber || 'N/A'}
		//   - Message: ${enquiry.message || 'N/A'}
		//   - Status: ${enquiry.status}

		//   Please review and take the necessary actions.

		//   Best Regards,
		//   ControlShift Team
		// `;
		await sendMail([user.email], subject, enquiryTemplate(user, enquiry));

		res.status(200).json({
			message: `Enquiry assigned to ${user.userName}`,
			enquiry,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Something went wrong', error });
	}
};
export const changeStatus = async (req, res) => {
	try {
		const { enquiryId, newStatus } = req.body; // Get enquiryId and userId from route params
		const { _id: changedBy } = req.user; // User making the change
		console.log({
			enquiryId,
			newStatus,
			changedBy,
		});

		// Find the enquiry and user
		const enquiry = await Enquiry.findById(enquiryId);
		const user = await User.findById(changedBy);

		if (!enquiry) {
			return res.status(404).json({ message: 'Enquiry not found' });
		}

		// Update enquiry with the assigned user
		enquiry.status = newStatus;

		// Add entry to change history
		enquiry.statusHistory.push({
			changedBy, // User making the change
			changes: `${user.userName} updated the status to "${newStatus}"`,
			status: newStatus,
		});

		// TODO send mail....
		// Save the updated enquiry
		await enquiry.save();
		const assignedUser = await User.findById(enquiry.assignedTo);

		await sendMail(
			[assignedUser.email],
			`Status Updated: ${enquiry.name}`,
			enquiryTemplate(assignedUser, enquiry)
		);

		res.status(200).json({
			message: `${user.userName} updated the status to "${newStatus}".`,
			enquiry,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Something went wrong', error });
	}
};

export const addComment = async (req, res) => {
	const { id } = req.params; // Enquiry ID
	const { comment } = req.body; // Comment content
	const userId = req.user._id; // User ID from authentication middleware

	try {
		const enquiry = await Enquiry.findById(id);
		if (!enquiry) {
			return res.status(404).json({ error: 'Enquiry not found' });
		}

		// Add the new comment
		const newComment = { comment, user: userId };
		enquiry.comments.push(newComment);

		await enquiry.save();

		res.status(200).json({ message: 'Comment added successfully', enquiry });
	} catch (error) {
		console.error('Error adding comment:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

// Delete a comment if it's by the same user
export const deleteComment = async (req, res) => {
	const { enquiryId, commentId } = req.params;
	const userId = req.user._id; // User ID from authentication middleware

	try {
		const enquiry = await Enquiry.findById(enquiryId);
		if (!enquiry) {
			return res.status(404).json({ error: 'Enquiry not found' });
		}

		const commentIndex = enquiry.comments.findIndex(
			(c) => c._id.toString() === commentId && c.user.toString() === userId
		);

		if (commentIndex === -1) {
			return res.status(403).json({
				error: 'You can only delete your own comments',
			});
		}

		// Remove the comment
		enquiry.comments.splice(commentIndex, 1);
		await enquiry.save();

		res.status(200).json({ message: 'Comment deleted successfully', enquiry });
	} catch (error) {
		console.error('Error deleting comment:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

export const updateQuotation = async (req, res) => {
	try {
		const { id } = req.params; // Get enquiry ID from params
		const { quotation } = req.body; // Get new quotation from request body

		if (!quotation) {
			return res.status(400).json({
				error: true,
				message: 'Quotation cannot be empty.',
			});
		}

		const updatedEnquiry = await Enquiry.findByIdAndUpdate(
			id,
			{ quotation },
			{ new: true } // Return the updated document
		);

		if (!updatedEnquiry) {
			return res.status(404).json({
				error: true,
				message: 'Enquiry not found.',
			});
		}

		return res.status(200).json({
			error: false,
			message: 'Quotation updated successfully.',
			payload: updatedEnquiry,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			error: true,
			message: 'Internal server error.',
		});
	}
};

export const updateRemark = async (req, res) => {
	try {
		const { id } = req.params; // Get enquiry ID from params
		const { remark } = req.body; // Get new remark from request body

		if (!remark) {
			return res.status(400).json({
				error: true,
				message: 'Remark cannot be empty.',
			});
		}

		const updatedEnquiry = await Enquiry.findByIdAndUpdate(
			id,
			{ remark },
			{ new: true } // Return the updated document
		);

		if (!updatedEnquiry) {
			return res.status(404).json({
				error: true,
				message: 'Enquiry not found.',
			});
		}

		return res.status(200).json({
			error: false,
			message: 'Remark updated successfully.',
			payload: updatedEnquiry,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			error: true,
			message: 'Internal server error.',
		});
	}
};
export const updatedEstimatedValue = async (req, res) => {
	try {
		const { id } = req.params; // Get enquiry ID from params
		const { estimatedValue } = req.body; // Get new estimatedValue from request body

		if (!estimatedValue) {
			return res.status(400).json({
				error: true,
				message: 'estimatedValue cannot be empty.',
			});
		}

		const updatedEnquiry = await Enquiry.findByIdAndUpdate(
			id,
			{ estimatedValue },
			{ new: true } // Return the updated document
		);

		if (!updatedEnquiry) {
			return res.status(404).json({
				error: true,
				message: 'Enquiry not found.',
			});
		}

		return res.status(200).json({
			error: false,
			message: 'estimatedValue updated successfully.',
			payload: updatedEnquiry,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			error: true,
			message: 'Internal server error.',
		});
	}
};
