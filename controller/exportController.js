const Product = require('../model/Product');
const Order = require('../model/Order');
const Coupon = require('../model/Coupon');
const Category = require('../model/Category');
const Banner = require('../model/Banner');
const Announcement = require('../model/Announcement');
const Offer = require('../model/Offer');
const { formatDataForExport } = require('../utils/export-utils');

const modelMap = {
	products: Product,
	orders: Order,
	coupons: Coupon,
	categories: Category,
	banners: Banner,
	announcements: Announcement,
	offers: Offer,
};

export const genericExport = async (req, res) => {
	try {
		console.log({ query: req.query });
		const entity = req.query.entity;
		const format = (req.query.format || 'json').toLowerCase();
		const status = req.query.status;
		const limit = parseInt(req.query.limit, 10) || 1000;

		if (!entity || !modelMap[entity]) {
			return res.status(400).json({ error: 'Invalid entity type' });
		}

		const Model = modelMap[entity];
		const filter = status ? { status } : {};

		// Fetch & process
		const data = await Model.find(filter)
			.sort({ createdAt: -1 })
			.limit(limit)
			.lean();

		const exportData = formatDataForExport(data);

		if (format === 'csv') {
			// Build CSV
			if (!exportData.length) {
				return res.status(200).send('');
			}
			const headers = Object.keys(exportData[0]);
			const rows = exportData.map((row) =>
				headers
					.map((h) => {
						const val = row[h] == null ? '' : String(row[h]);
						return val.includes(',') || val.includes('"')
							? `"${val.replace(/"/g, '""')}"`
							: val;
					})
					.join(',')
			);
			const csv = [headers.join(','), ...rows].join('\n');

			res.setHeader(
				'Content-Disposition',
				`attachment; filename="${entity}.csv"`
			);
			res.type('text/csv');
			return res.send(csv);
		}

		// Default: JSON
		return res.json(exportData);
	} catch (err) {
		console.error('genericExport error:', err);
		return res.status(500).json({ error: err.message || 'Export failed' });
	}
};
