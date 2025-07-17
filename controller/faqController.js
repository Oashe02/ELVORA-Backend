import Faq  from '../model/Faq.js';
// const FaqCategory = require('../model/FaqCategory');

export const getFaqs = async (req, res) => {
	try {
		const { /* category, */ isActive } = req.query;
		const query = {};
		// if (category) query.category = category;
		if (isActive === 'true') query.isActive = true;
		if (isActive === 'false') query.isActive = false;

		const faqs = await Faq.find(query)
			.sort({ order: 1, createdAt: -1 })
			// .populate('category', 'title slug')
			.lean();

		return res.json(faqs);
	} catch (err) {
		console.error('getFaqs error:', err);
		return res.status(500).json({ error: err.message });
	}
};

export const createFaq = async (req, res) => {
	try {
		const body = req.body;
		// ensure category exists
		// const exists = await FaqCategory.exists({ _id: body.category });
		// if (!exists) {
		// 	return res.status(400).json({ error: 'Category not found' });
		// }

		// create and link
		const faq = await Faq.create(body);
		// await FaqCategory.findByIdAndUpdate(body.category, {
		// 	$push: { faqs: faq._id },
		// });

		return res.status(201).json(faq);
	} catch (err) {
		console.error('createFaq error:', err);
		return res.status(400).json({ error: err.message });
	}
};

export const getFaqById = async (req, res) => {
	try {
		const faq = await Faq.findById(req.params.id)
			// .populate('category', 'title slug')
			.lean();
		if (!faq) {
			return res.status(404).json({ error: 'FAQ not found' });
		}
		return res.json(faq);
	} catch (err) {
		console.error('getFaqById error:', err);
		return res.status(500).json({ error: err.message });
	}
};

export const updateFaq = async (req, res) => {
	try {
		const body = req.body;
		const faq = await Faq.findById(req.params.id);
		if (!faq) {
			return res.status(404).json({ error: 'FAQ not found' });
		}

		// if (body.category && body.category !== faq.category.toString()) {
		// 	await FaqCategory.findByIdAndUpdate(faq.category, {
		// 		$pull: { faqs: faq._id },
		// 	});
		// 	await FaqCategory.findByIdAndUpdate(body.category, {
		// 		$push: { faqs: faq._id },
		// 	});
		// }

		const updated = await Faq.findByIdAndUpdate(req.params.id, body, {
			new: true,
			runValidators: true,
		})// .populate('category', 'title slug');

		return res.json(updated);
	} catch (err) {
		console.error('updateFaq error:', err);
		return res.status(400).json({ error: err.message });
	}
};

export const deleteFaq = async (req, res) => {
	try {
		const faq = await Faq.findById(req.params.id);
		if (!faq) {
			return res.status(404).json({ error: 'FAQ not found' });
		}

		// remove from category and delete
		// await FaqCategory.findByIdAndUpdate(faq.category, {
		// 	$pull: { faqs: faq._id },
		// });
		await faq.deleteOne();

		return res.json({ message: 'FAQ deleted successfully' });
	} catch (err) {
		console.error('deleteFaq error:', err);
		return res.status(500).json({ error: err.message });
	}
};
