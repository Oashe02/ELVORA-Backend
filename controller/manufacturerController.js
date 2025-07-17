import Manufacturer from '../model/Manufacturer.js';
import { generateSlug } from '../utils/func.js';

export const getManufactures = async (req, res) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const status = req.query.status;
		const skip = (page - 1) * limit;
		const filter = status ? { status } : {};

		const [categories, totalCategories] = await Promise.all([
			Manufacturer.find(filter)
				.sort({ priority: -1, createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Manufacturer.countDocuments(filter),
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

export const createManufactures = async (req, res) => {
	try {
		const manufacturer = await Manufacturer.create({
			...req.body,
			slug: generateSlug(req.body.name),
		});
		return res.status(201).json(manufacturer);
	} catch (err) {
		console.error('createCategory error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to create manufacturer' });
	}
};

export const getManufacturesByID = async (req, res) => {
	try {
		const manufacturer = await Manufacturer.findById(req.params.id).lean();
		if (!manufacturer) {
			return res.status(404).json({ error: 'Manufacturer not found' });
		}
		return res.json(manufacturer);
	} catch (err) {
		console.error('getCategoryById error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch manufacturer' });
	}
};

export const updateManfacture = async (req, res) => {
	try {
		const updated = await Manufacturer.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			}
		).lean();

		if (!updated) {
			return res.status(404).json({ error: 'Manufacturer not found' });
		}
		return res.json(updated);
	} catch (err) {
		console.error('updateCategory error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to update manufacturer' });
	}
};

export const deleteManufacture = async (req, res) => {
	try {
		const deleted = await Manufacturer.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: 'Manufacturer not found' });
		}
		return res.json({ success: true });
	} catch (err) {
		console.error('deleteCategory error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to delete manufacturer' });
	}
};
