import Announcement from '../model/Announcement.js';

export const getAnnouncements = async (req, res) => {
	try {
		const page = parseInt(req.query.page || '1', 10);
		const limit = parseInt(req.query.limit || '10', 10);
		const status = req.query.status;
		const skip = (page - 1) * limit;

		const filter = status ? { status } : {};

		const [announcements, total] = await Promise.all([
			Announcement.find(filter)
				.sort({ priority: -1, createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Announcement.countDocuments(filter),
		]);

		const totalPages = Math.ceil(total / limit);

		res.json({
			announcements,
			totalAnnouncements: total,
			totalPages,
			currentPage: page,
		});
	} catch (err) {
		res
			.status(500)
			.json({ error: err.message || 'Failed to fetch announcements' });
	}
};

export const createAnnouncement = async (req, res) => {
	try {
		const announcement = new Announcement(req.body);
		await announcement.save();

		res.status(201).json(announcement);
	} catch (err) {
		res
			.status(400)
			.json({ error: err.message || 'Failed to create announcement' });
	}
};

export const getAnnouncementById = async (req, res) => {
	try {
		// Ensure Mongo is connected before running any query

		const announcement = await Announcement.findById(req.params.id).lean();
		if (!announcement) {
			return res.status(404).json({ error: 'Announcement not found' });
		}
		return res.json(announcement);
	} catch (err) {
		return res
			.status(500)
			.json({ error: err.message || 'Failed to fetch announcement' });
	}
};

export const updateAnnouncement = async (req, res) => {
	try {
		const updated = await Announcement.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true }
		).lean();

		if (!updated) {
			return res.status(404).json({ error: 'Announcement not found' });
		}
		return res.json(updated);
	} catch (err) {
		return res
			.status(400)
			.json({ error: err.message || 'Failed to update announcement' });
	}
};

export const deleteAnnouncement = async (req, res) => {
	try {
		const deleted = await Announcement.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: 'Announcement not found' });
		}
		return res.json({ success: true });
	} catch (err) {
		return res
			.status(500)
			.json({ error: err.message || 'Failed to delete announcement' });
	}
};
