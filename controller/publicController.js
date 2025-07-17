import Category from '../model/Category.js';
import Coupon from '../model/Coupon.js';
import Product from '../model/Product.js';


// Tax settings
export const getAllProductsPath = async (req, res) => {
	try {
		const products = await Product.find({ status: 'active' })
			.select('slug id name')
			.lean();
		res.json({
			success: true,
			products,
		});
	} catch (err) {
		console.error('getTaxSettings error:', err);
		res.status(500).json({ error: 'Failed to fetch tax settings' });
	}
};
export const getProductByCategory = async (req, res) => {
	try {
		const category = await Category.findOne({ slug: req.params.slug });
		console.log({ category });

		const products = await Product.find({
			category: category._id,
		}).lean();
		res.json({
			success: true,
			products,
		});
	} catch (err) {
		console.error('getTaxSettings error:', err);
		res.status(500).json({ error: 'Failed to fetch tax settings' });
	}
};
export const getSingleProduct = async (req, res) => {
	try {
		const product = await Product.findOne({ slug: req.params.slug }).lean();
		res.json({
			success: true,
			product,
		});
	} catch (err) {
		console.error('getTaxSettings error:', err);
		res.status(500).json({ error: 'Failed to fetch tax settings' });
	}
};
export const getCouponsPublic = async (req, res) => {
	try {
		const coupons = await Coupon.find({
			status: 'active',
		}).lean();
		res.json({
			success: true,
			coupons,
		});
	} catch (err) {
		console.error('getTaxSettings error:', err);
		res.status(500).json({ error: 'Failed to fetch coupons' });
	}
};
