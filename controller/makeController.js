import  Make from '../model/Make.js';
import  { generateSlug } from '../utils/func.js';

export const getMakes = async (req, res) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const status = req.query.status;
		const skip = (page - 1) * limit;
		const filter = status ? { status } : {};

		const [categories, totalCategories] = await Promise.all([
			Make.find(filter)
				.sort({ priority: -1, createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Make.countDocuments(filter),
		]);

		const totalPages = Math.ceil(totalCategories / limit);

		return res.json({
			categories,
			totalCategories,
			totalPages,
			currentPage: page,
		});
	} catch (err) {
		console.error('getCategories error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch categories' });
	}
};

export const createMake = async (req, res) => {
	try {
		const category = await Make.create({
			...req.body,
			slug: generateSlug(req.body.name),
		});
		return res.status(201).json(category);
	} catch (err) {
		console.error('createCategory error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to create category' });
	}
};

export const getMakeByID = async (req, res) => {
	try {
		const category = await Make.findById(req.params.id).lean();
		if (!category) {
			return res.status(404).json({ error: 'Make not found' });
		}
		return res.json(category);
	} catch (err) {
		console.error('getCategoryById error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch category' });
	}
};

export const updateMake = async (req, res) => {
	try {
		const updated = await Make.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		}).lean();

		if (!updated) {
			return res.status(404).json({ error: 'Make not found' });
		}
		return res.json(updated);
	} catch (err) {
		console.error('updateCategory error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to update category' });
	}
};

export const deleteMake = async (req, res) => {
	try {
		const deleted = await Make.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: 'Make not found' });
		}
		return res.json({ success: true });
	} catch (err) {
		console.error('deleteCategory error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to delete category' });
	}
};
