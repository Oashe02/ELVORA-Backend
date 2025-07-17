import FeedPost from '../model/FeedPost.js';
import slugify from "slugify";


// Helper: Generate a unique slug
const generateUniqueSlug = async (base, model) => {
	let slug = slugify(base, { lower: true, strict: true });
	let uniqueSlug = slug;
	let count = 1;
  
	while (await model.findOne({ slug: uniqueSlug })) {
	  uniqueSlug = `${slug}-${count++}`;
	}
  
	return uniqueSlug;
  };


export const getPosts = async (req, res) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const { status, tag } = req.query;
		const skip = (page - 1) * limit;

		// Build filter
		const filter = {};
		if (status) filter.status = status;
		if (tag) filter.tags = tag;

		const [posts, totalPosts] = await Promise.all([
			FeedPost.find(filter)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			FeedPost.countDocuments(filter),
		]);

		
	  

		return res.json({
			posts,
			totalPosts,
			totalPages: Math.ceil(totalPosts / limit),
			currentPage: page,
		});
	} catch (err) {
		console.error('getPosts error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch posts' });
	}
};

export const createPost = async (req, res) => {
	try {
	  const body = req.body;
  
	  // Validate media array
	  if (!Array.isArray(body.media) || body.media.length === 0) {
		return res.status(400).json({ error: "At least one media item is required" });
	  }
  
	  // Generate slug from caption if not provided
	  if (!body.slug || typeof body.slug !== "string" || body.slug.trim() === "") {
		if (!body.caption || typeof body.caption !== "string") {
		  return res.status(400).json({ error: "Caption is required to generate slug" });
		}
		body.slug = slugify(body.caption, { lower: true, strict: true });
	  }
  
	  // Check if slug already exists
	  const exists = await FeedPost.findOne({ slug: body.slug });
	  if (exists) {
		return res.status(400).json({ error: "Slug already exists" });
	  }
  
	  const post = await FeedPost.create(body);
	  return res.status(201).json(post);
	} catch (err) {
	  console.error("createPost error:", err);
	  return res.status(400).json({
		error: err.message || "Failed to create post",
	  });
	}
  };

export const getPostById = async (req, res) => {
	try {
		const post = await FeedPost.findById(req.params.id).lean();
		if (!post) {
			return res.status(404).json({ error: 'Post not found' });
		}
		return res.json(post);
	} catch (err) {
		console.error('getPostById error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch post' });
	}
};

export const updatePost = async (req, res) => {
	try {
		const body = req.body;

		const updated = await FeedPost.findByIdAndUpdate(req.params.id, body, {
			new: true,
			runValidators: true,
		}).lean();

		if (!updated) {
			return res.status(404).json({ error: 'Post not found' });
		}
		return res.json(updated);
	} catch (err) {
		console.error('updatePost error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to update post' });
	}
};

export const deletePost = async (req, res) => {
	try {
		const deleted = await FeedPost.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: 'Post not found' });
		}
		return res.json({ success: true });
	} catch (err) {
		console.error('deletePost error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to delete post' });
	}
};
