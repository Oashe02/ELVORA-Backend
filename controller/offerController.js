import Offer from '../model/Offer.js';

export const getOffers = async (req, res) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const { status, featured, target, search } = req.query;
		const skip = (page - 1) * limit;

		// Build filter
		const filter = {};
		if (status) filter.status = status;
		if (featured) filter.featured = featured === 'true';
		if (target) filter.target = target;
		if (search) {
			const re = new RegExp(search, 'i');
			filter.$or = [
				{ title: { $regex: re } },
				{ description: { $regex: re } },
				{ shortDescription: { $regex: re } },
			];
		}

		const [offers, totalOffers] = await Promise.all([
			Offer.find(filter)
				.sort({ priority: -1, createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate('targetProducts', 'name')
				.populate('targetCategories', 'name')
				.populate('bundleProducts', 'name')
				.populate('giftProductId', 'name')
				.lean(),
			Offer.countDocuments(filter),
		]);

		return res.json({
			offers,
			totalOffers,
			totalPages: Math.ceil(totalOffers / limit),
			currentPage: page,
		});
	} catch (err) {
		console.error('getOffers error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch offers' });
	}
};

export const createOffer = async (req, res) => {
	try {
		const body = { ...req.body };

		// clamp percentage
		if (body.type === 'percentage' && body.value > 100) {
			body.value = 100;
		}

		const offer = await Offer.create({
			...body,
			viewCount: 0,
			clickCount: 0,
			conversionCount: 0,
		});

		return res.status(201).json(offer);
	} catch (err) {
		console.error('createOffer error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to create offer' });
	}
};

export const getOfferById = async (req, res) => {
	try {
		const offer = await Offer.findById(req.params.id)
			.populate('targetProducts', 'name')
			.populate('targetCategories', 'name')
			.populate('bundleProducts', 'name')
			.populate('giftProductId', 'name')
			.lean();

		if (!offer) {
			return res.status(404).json({ error: 'Offer not found' });
		}
		return res.json(offer);
	} catch (err) {
		console.error('getOfferById error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch offer' });
	}
};

export const updateOffer = async (req, res) => {
	try {
		const body = { ...req.body };
		if (body.type === 'percentage' && body.value > 100) {
			body.value = 100;
		}

		const updated = await Offer.findByIdAndUpdate(req.params.id, body, {
			new: true,
			runValidators: true,
		});

		if (!updated) {
			return res.status(404).json({ error: 'Offer not found' });
		}
		return res.json(updated);
	} catch (err) {
		console.error('updateOffer error:', err);
		return res
			.status(400)
			.json({ error: err.message || 'Failed to update offer' });
	}
};

export const deleteOffer = async (req, res) => {
	try {
		const deleted = await Offer.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: 'Offer not found' });
		}
		return res.json({ success: true });
	} catch (err) {
		console.error('deleteOffer error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to delete offer' });
	}
};

export const trackOfferMetric = async (req, res) => {
	try {
		const { action } = req.body;
		if (!action) {
			return res.status(400).json({ error: 'Action is required' });
		}

		let field;
		switch (action) {
			case 'view':
				field = 'viewCount';
				break;
			case 'click':
				field = 'clickCount';
				break;
			case 'conversion':
				field = 'conversionCount';
				break;
			default:
				return res.status(400).json({ error: 'Invalid action' });
		}

		const updated = await Offer.findByIdAndUpdate(
			req.params.id,
			{ $inc: { [field]: 1 } },
			{ new: true }
		);

		if (!updated) {
			return res.status(404).json({ error: 'Offer not found' });
		}
		return res.json({ success: true, [field]: updated[field] });
	} catch (err) {
		console.error('trackOfferMetric error:', err);
		return res
			.status(500)
			.json({ error: err.message || 'Failed to track offer metric' });
	}
};
