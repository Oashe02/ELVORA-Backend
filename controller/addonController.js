import  AddOn from '../model/addOn.js';
import { generateSlug } from '../utils/func.js';

export const getAddons = async (req, res) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const status = req.query.status;
		const skip = (page - 1) * limit;
		const filter = status ? { status } : {};

		const [addons, totalAddons] = await Promise.all([
			AddOn.find(filter)
				.sort({ priority: -1, createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
                AddOn.countDocuments(filter),
		]);

		const totalPages = Math.ceil(totalAddons / limit);

		return res.json({
			addons,
			totalAddons,
			totalPages,
			currentPage: page,
		});
	} catch (err) {
		console.error('getAddons error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch Addons' });
	}
};

export const createAddon = async (req, res) => {
	try {
		if (!req.body.name) {
			return res.status(400).json({ error: 'Name is required' });
		}

		const slug = generateSlug(req.body.name);

		const newAddon = await AddOn.create({
			...req.body,
			slug,
		});

		return res.status(201).json(newAddon);
	} catch (err) {
		console.error('createAddon error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to create addon' });
	}
};


export const getAddonById = async (req, res) => {
	try {
		const Addon = await AddOn.findById(req.params.id).lean();
		if (!Addon) {
			return res.status(404).json({ error: 'AddOn not found' });
		}
		return res.json(Addon);
	} catch (err) {
		console.error('getAddonById error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch AddOn' });
	}
};

export const updateAddon = async (req, res) => {
	try {
		const updated = await AddOn.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		}).lean();

		if (!updated) {
			return res.status(404).json({ error: 'Addon not found' });
		}
		return res.json(updated);
	} catch (err) {
		console.error('updateAddon error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to update Addon' });
	}
};

export const deleteAddon = async (req, res) => {
	try {
		const deleted = await AddOn.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: 'AddOn not found' });
		}
		return res.json({ success: true });
	} catch (err) {
		console.error('deleteAddon error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to delete AddOn' });
	}
};
