const { validationResult } = require('express-validator');
const Group = require('../model/Group');
const Blog = require('../model/Blog');
const { generateSlug } = require('../utils/utils');
import mongoose from "mongoose";

const getAllPublicBlog = async (req, res) => {
	try {
		const blogs = await Blog.find(
			{
				siteName: req.params.siteName,
				isDraft: false,
			},
			'title subtitle createdAt tags mainTag videoUrl thumbnailUrl views comments hearts slug'
		)
			.sort({ createdAt: -1 }) // Sort by creation date (latest first)
			.exec();

		return res.json({
			error: false,
			message: 'Blogs',
			payload: blogs,
		});
	} catch (error) {
		console.log(error);
		return res.json({
			error: true,
			message: 'Something wents wrong, Please try after sometime',
		});
	}
};
const getSingleBlog = async (req, res) => {
	try {
		const blog = await Blog.findOneAndUpdate(
			{
				slug: req.params.slug,
				isDraft: false,
			},
			{
				$inc: {
					views: 1,
				},
			}
		).populate({
			path: 'createdBy',
			select: 'userName avatar', // Only select the userName and avatar fields
		});
		if (!blog)
			return res.json({
				error: true,
				message: 'No Blog Found',
			});
		const approvedComments = blog.comments.filter(
			(comment) => comment.isApproved
		);

		return res.json({
			error: false,
			message: 'Blog Found',
			payload: {
				...blog.toObject(),
				comments: approvedComments,
			},
		});
	} catch (error) {
		console.log(error);
		return res.json({
			error: true,
			message: 'Something wents wrong, Please try after sometime',
		});
	}
};

const getAllBlog = async (req, res) => {
	try {
		// Default pagination values if not provided in query
		const page = parseInt(req.query.page) || 1; // Page number
		const limit = parseInt(req.query.limit) || 10; // Number of blogs per page
		const skip = (page - 1) * limit; // Skip value for pagination

		// MongoDB aggregation pipeline
		const blogs = await Blog.aggregate([
			{
				$match: {
					siteName: req.params.siteName, // Match siteName from params
				},
			},
			// {
			// 	$project: {
			// 		title: 1,
			// 		subtitle: 1,
			// 		tags: 1,
			// 		mainTag: 1,
			// 		videoUrl: 1,
			// 		thumbnailUrl: 1,
			// 		views: 1,
			// 		comments: 1,
			// 		hearts: 1,
			// 		slug: 1,
			// 		isDraft: 1,
			// 		createdAt: 1,
			// 		updatedAt: 1,
			// 	},
			// },
			{
				$sort: { createdAt: -1 }, // Sort by creation date, latest first
			},
			{
				$skip: skip, // Skip documents for pagination
			},
			{
				$limit: limit, // Limit the number of documents to 'limit'
			},
		]);

		// Get total count of blogs matching the filter (for pagination metadata)
		const totalBlogs = await Blog.countDocuments({
			siteName: req.params.siteName,
		});

		return res.json({
			error: false,
			message: 'Blogs fetched successfully',
			payload: {
				docs: blogs,
				currentPage: page,
				totalPages: Math.ceil(totalBlogs / limit), // Calculate total pages
				totalBlogs, // Total number of blogs
				hasNextPage: page * limit < totalBlogs, // Check if there's a next page
				hasPrevPage: page > 1, // Check if there's a previous page
			},
		});
	} catch (error) {
		console.error(error);
		return res.json({
			error: true,
			message: 'Something went wrong. Please try again later.',
		});
	}
};

const getAdminSingle = async (req, res) => {
	try {
		const blog = await Blog.findOne({
			slug: req.params.slug,
		}).populate({
			path: 'createdBy',
			select: 'userName avatar', // Only select the userName and avatar fields
		});
		if (!blog)
			return res.json({
				error: true,
				message: 'No Blog Found',
			});

		return res.json({
			error: false,
			message: 'Blog Found',
			payload: blog,
		});
	} catch (error) {
		console.log(error);
		return res.json({
			error: true,
			message: 'Something wents wrong, Please try after sometime',
		});
	}
};
const createBlog = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors.array());
			return res.json({ error: true, message: errors.array()[0].msg });
		}

		const {
			// writerName,
			// writerDescription,
			// writerProfileUrl,
			// writerLink,
			title,
			subtitle,
			tags,
			mainTag,
			videoUrl,
			thumbnailUrl,
			mainImageUrl,
			blogContent,
			siteName,
			isDraft,
		} = req.body;
		console.log(req.body);
		const newBlogPost = await new Blog({
			// writerName,
			// writerDescription,
			// writerProfileUrl,
			// writerLink,
			title,
			subtitle,
			tags,
			mainTag,
			videoUrl,
			thumbnailUrl,
			mainImageUrl,
			blogContent,
			siteName,
			slug: generateSlug(title),
			isDraft,
			createdBy: req.user._id,
		}).save();

		console.log(newBlogPost);

		if (!newBlogPost)
			return res.json({
				error: true,
				message: 'Something wents wrong, Please try after sometime',
			});
		return res.json({
			error: false,
			message: 'Blog Added',
			payload: newBlogPost,
		});
	} catch (error) {
		console.log({ error });
		return res.json({
			error: true,
			message: 'Something wents wrong, Please try after sometime',
		});
	}
};
const deleteBlog = async (req, res) => {
	try {
		const { id } = req.params;

		// Validate the ID (optional but recommended)
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({
				message: 'Invalid blog ID format',
			});
		}

		// Find and delete the blog post with the specified ID
		const deletedBlog = await Blog.findByIdAndDelete(id);
		return res.json({
			error: false,
			message: 'Deleted',
			payload: deletedBlog,
		});
	} catch (error) {
		console.log({ error });
		return res.json({
			error: true,
			message: 'Something wents wrong, Please try after sometime',
		});
	}
};
const publishBlog = async (req, res) => {
	try {
		const { id } = req.params;

		// Validate the ID (optional but recommended)
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({
				message: 'Invalid blog ID format',
			});
		}

		// Find and delete the blog post with the specified ID
		const deletedBlog = await Blog.findByIdAndUpdate(id, {
			isDraft: false,
		});
		return res.json({
			error: false,
			message: 'Published',
			payload: deletedBlog,
		});
	} catch (error) {
		console.log({ error });
		return res.json({
			error: true,
			message: 'Something wents wrong, Please try after sometime',
		});
	}
};
const editBlog = async (req, res) => {
	try {
		// Extract ID from request parameters
		const { id } = req.params;

		// Validate the ID (optional but recommended)
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({
				message: 'Invalid blog ID format',
			});
		}

		// Extract and validate request body
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				errors: errors.array(),
			});
		}

		// Extract data from the request body
		const {
			writerName,
			writerDescription,
			writerProfileUrl,
			writerLink,
			title,
			subtitle,
			tags,
			mainTag,
			videoUrl,
			thumbnailUrl,
			mainImageUrl,
			blogContent,
			isDraft,
		} = req.body;

		// Update the blog post with the specified ID
		const updatedBlog = await Blog.findByIdAndUpdate(
			id,
			{
				writerName,
				writerDescription,
				writerProfileUrl,
				writerLink,
				title,
				subtitle,
				tags,
				mainTag,
				videoUrl,
				thumbnailUrl,
				mainImageUrl,
				isDraft,
				blogContent,
			},
			{ new: true, runValidators: true } // Return the updated document and run validators
		);

		// Check if the blog post was found and updated
		if (!updatedBlog) {
			return res.json({
				error: true,
				message: 'Blog post not found',
			});
		}

		// Send a response
		return res.json({
			error: false,
			message: 'Blog post updated successfully',
			payload: updatedBlog,
		});
	} catch (error) {
		// Handle errors
		res.status(500).json({
			message: 'Failed to update blog post',
			error: error.message,
		});
	}
};

const addComment = async (req, res) => {
	try {
		// Extract ID from request parameters
		const { id } = req.params;

		// Validate the ID (optional but recommended)
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({
				message: 'Invalid blog ID format',
			});
		}

		// Extract comment data from the request body
		const { comment } = req.body;

		// Validate that a comment is provided
		if (
			!comment ||
			typeof comment !== 'string' ||
			comment.trim().length === 0
		) {
			return res.status(400).json({
				message: 'Comment is required and must be a non-empty string',
			});
		}

		// Find the blog post by ID and update its comments
		const blog = await Blog.findById(id);

		// Check if the blog post was found
		if (!blog) {
			return res.status(404).json({
				message: 'Blog post not found',
			});
		}

		// Add the new comment to the comments array
		blog.comments.push({ text: comment, date: new Date(), isApproved: false });

		// Save the updated blog post
		const updatedBlog = await blog.save();

		return res.json({
			error: true,
			message: 'Comment added for review, After review it will be published',
		});
	} catch (error) {
		// Handle errors
		res.status(500).json({
			message: 'Failed to add comment',
			error: error.message,
		});
	}
};

const approveComment = async (req, res) => {
	try {
		const { blogId, commentId } = req.params;

		// Validate the IDs
		if (
			!mongoose.Types.ObjectId.isValid(blogId) ||
			!mongoose.Types.ObjectId.isValid(commentId)
		) {
			return res.status(400).json({
				message: 'Invalid blog or comment ID format',
			});
		}

		// Find the blog post and update the comment's approval status
		const blog = await Blog.findOneAndUpdate(
			{ _id: blogId, 'comments._id': commentId },
			{ $set: { 'comments.$.isApproved': true } },
			{ new: true }
		);

		// Check if the blog post or comment was found
		if (!blog) {
			return res.json({
				error: true,
				message: 'Blog post or comment not found',
			});
		}

		// Send a response
		return res.json({
			error: false,
			message: 'Comment approved successfully',
			payload: blog,
		});
	} catch (error) {
		// Handle errors
		res.status(500).json({
			message: 'Failed to approve comment',
			error: error.message,
		});
	}
};

// Delete a comment by its ID
const deleteComment = async (req, res) => {
	try {
		const { blogId, commentId } = req.params;

		// Validate the IDs
		if (
			!mongoose.Types.ObjectId.isValid(blogId) ||
			!mongoose.Types.ObjectId.isValid(commentId)
		) {
			return res.status(400).json({
				message: 'Invalid blog or comment ID format',
			});
		}

		// Find the blog post and remove the comment
		const blog = await Blog.findOneAndUpdate(
			{ _id: blogId },
			{ $pull: { comments: { _id: commentId } } },
			{ new: true }
		);

		// Check if the blog post was found and the comment was removed
		if (!blog) {
			return res.json({
				error: true,
				message: 'Blog post or comment not found',
			});
		}

		// Send a response
		return res.json({
			error: false,
			message: 'Comment deleted successfully',
			payload: blog,
		});
	} catch (error) {
		// Handle errors
		res.status(500).json({
			message: 'Failed to delete comment',
			error: error.message,
		});
	}
};

module.exports = {
	getAllPublicBlog,
	createBlog,
	getSingleBlog,
	deleteBlog,
	editBlog,
	getAdminSingle,
	getAllBlog,
	addComment,
	approveComment,
	deleteComment,
	publishBlog,
};
