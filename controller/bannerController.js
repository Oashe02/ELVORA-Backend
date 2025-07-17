import  Banner  from '../model/Banner.js';
import { generateSlug } from '../utils/func.js';

export const getBanners = async (req, res) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const status = req.query.status;
		const skip = (page - 1) * limit;

		const filter = status ? { status } : {};

		const [banners, totalBanners] = await Promise.all([
			Banner.find(filter)
				.sort({ priority: -1, createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Banner.countDocuments(filter),
		]);

		const totalPages = Math.ceil(totalBanners / limit);

		return res.json({
			banners,
			totalBanners,
			totalPages,
			currentPage: page,
		});
	} catch (err) {
		console.error('getBanners error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch banners' });
	}
};

export const createBanner = async (req, res) => {
	try {
		const banner = await Banner.create({
			...req.body,
			slug: generateSlug(req.body.title || 'banner'),
		});
		return res.status(201).json(banner);
	} catch (err) {
		console.error('createBanner error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to create banner' });
	}
};

export const getBannerById = async (req, res) => {
	try {
		const banner = await Banner.findById(req.params.id).lean();
		if (!banner) {
			return res.status(404).json({ error: 'Banner not found' });
		}
		return res.json(banner);
	} catch (err) {
		console.error('getBannerById error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch banner' });
	}
};

export const updateBanner = async (req, res) => {
	try {
		const updated = await Banner.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		}).lean();

		if (!updated) {
			return res.status(404).json({ error: 'Banner not found' });
		}
		return res.json(updated);
	} catch (err) {
		console.error('updateBanner error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to update banner' });
	}
};

export const deleteBanner = async (req, res) => {
	try {
		const deleted = await Banner.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: 'Banner not found' });
		}
		return res.json({ success: true });
	} catch (err) {
		console.error('deleteBanner error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to delete banner' });
	}
};
