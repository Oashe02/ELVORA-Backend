import Coupon  from "../model/Coupon.js";
import User  from "../model/User.js";
import { validateAndCalculateCoupon }  from "../utils/couponFuncs.js";

// const { calculateDiscount, validateCoupon } = require('../utils/funcs');

export const getCoupons = async (req, res) => {
	try {
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const { status, scope, customerType, search, featured } = req.query;
		const skip = (page - 1) * limit;

		// Build filter
		const filter = {};
		if (status) filter.status = status;
		if (scope) filter.scope = scope;
		if (customerType) filter.customerType = customerType;
		if (featured === "true") filter.featured = true;
		if (featured === "false") filter.featured = false;
		if (search) {
			const re = new RegExp(search, "i");
			filter.$or = [{ code: re }, { description: re }];
		}

		const [coupons, totalCoupons] = await Promise.all([
			Coupon.find(filter)
				.sort({ featured: -1, createdAt: -1 })
				.skip(skip)
				.limit(limit)
				// .populate('products', 'name')
				// .populate('categories', 'name')
				.lean(),
			Coupon.countDocuments(filter),
		]);

		return res.json({
			coupons,
			totalCoupons,
			totalPages: Math.ceil(totalCoupons / limit),
			currentPage: page,
		});
	} catch (err) {
		console.error("getCoupons error:", err);
		return res.status(500).json({ error: err.message });
	}
};

export const createCoupon = async (req, res) => {
	try {
		const body = { ...req.body };
		if (!body.code) {
			return res.status(400).json({ error: "Coupon code is required" });
		}

		// uppercase & uniqueness check
		body.code = body.code.toUpperCase();
		const exists = await Coupon.findOne({ code: body.code });
		if (exists) {
			return res
				.status(400)
				.json({ error: "Coupon with this code already exists" });
		}

		const coupon = await Coupon.create({
			...body,
			usageCount: 0,
			usedBy: [],
		});

		return res.status(201).json(coupon);
	} catch (err) {
		console.error("createCoupon error:", err);
		return res.status(400).json({ error: err.message });
	}
};

export const validateCoupon = async (req, res) => {
	try {
		const user = req.user;
		const { code, cart, shippingCost } = req.body;
		if (!code) {
			return res
				.status(400)
				.json({ success: false, message: "Coupon code is required" });
		}

		// find coupon case-insensitive
		const coupon = await Coupon.findOne({ code: new RegExp(`^${code}$`, "i") });
		if (!coupon) {
			return res.status(404).json({
				success: false,
				reason: "NOT_FOUND",
				message: "Invalid coupon code",
			});
		}

		// check previous orders
		const customerId = user?.id?.toString();
		const hasOrders = !!(
			customerId &&
			(await User.findOne({
				_id: customerId,
				lastOrderDate: { $exists: true },
			}))
		);

		// validation logic
		const couponRes = await validateAndCalculateCoupon({
			code: coupon.code,
			userId: user?._id,
			isFirstPurchase: !hasOrders,
			cartItems: cart || [],
			shippingCost: shippingCost || 0,
		});
		console.log(couponRes);

		if (!couponRes.valid) {
			return res.status(400).json({
				success: false,
				reason: couponRes.reason,
				message: couponRes.message,
			});
		}

		if (
			couponRes.discount <= 0 &&
			!couponRes.freeShipping &&
			(!couponRes.freeItems || couponRes.freeItems.length === 0)
		) {
			return res.json({
				success: false,
				message: "This coupon does not apply to your cart",
				reason: "NO_BENEFIT",
			});
		}

		return res.json({
			success: true,
			message: "Coupon applied successfully",
			coupon: coupon.toObject(),
			...couponRes,
		});
	} catch (err) {
		console.error("validateCoupon error:", err);
		return res.json({ success: false, message: err.message });
	}
};

export const getFeaturedCoupon = async (req, res) => {
	try {
		const now = new Date();
		const coupon = await Coupon.findOne({
			featured: true,
			status: "active",
			isActive: true,
			startDate: { $lte: now },
			expiryDate: { $gt: now },
		})
			.populate("applicableProducts", "name")
			.populate("applicableCategories", "name")
			.populate("excludedProducts", "name")
			.populate("excludedCategories", "name")
			// .populate('getYProductId', 'name')
			.lean();

		if (!coupon) {
			return res.status(404).json({ message: "No featured coupon available" });
		}
		return res.json(coupon);
	} catch (err) {
		console.error("getFeaturedCoupon error:", err);
		return res.status(500).json({ error: err.message });
	}
};

export const getCouponById = async (req, res) => {
	try {
		const coupon = await Coupon.findById(req.params.id)
			.populate("applicableProducts", "name")
			.populate("applicableCategories", "name")
			.populate("excludedProducts", "name")
			.populate("excludedCategories", "name")
			// .populate('getYProductId', 'name')
			.lean();

		if (!coupon) {
			return res.status(404).json({ error: "Coupon not found" });
		}
		return res.json(coupon);
	} catch (err) {
		console.error("getCouponById error:", err);
		return res.status(500).json({ error: err.message });
	}
};

export const updateCoupon = async (req, res) => {
	try {
		const body = { ...req.body };
		if (body.code) {
			body.code = body.code.toUpperCase();
			const exists = await Coupon.findOne({
				code: body.code,
				_id: { $ne: req.params.id },
			});
			if (exists) {
				return res
					.status(400)
					.json({ error: "Coupon with this code already exists" });
			}
		}

		const updated = await Coupon.findByIdAndUpdate(req.params.id, body, {
			new: true,
			runValidators: true,
		}).lean();

		if (!updated) {
			return res.status(404).json({ error: "Coupon not found" });
		}
		return res.json(updated);
	} catch (err) {
		console.error("updateCoupon error:", err);
		return res.status(400).json({ error: err.message });
	}
};

export const deleteCoupon = async (req, res) => {
	try {
		const deleted = await Coupon.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: "Coupon not found" });
		}
		return res.json({ success: true });
	} catch (err) {
		console.error("deleteCoupon error:", err);
		return res.status(500).json({ error: err.message });
	}
};

export const setCouponFeatured = async (req, res) => {
	try {
		const { featured } = req.body;
		if (featured === true) {
			// unset previous featured
			await Coupon.updateMany(
				{ featured: true },
				{ $set: { featured: false } }
			);
		}
		const updated = await Coupon.findByIdAndUpdate(
			req.params.id,
			{ featured },
			{ new: true }
		)
			.populate("applicableProducts", "name")
			.populate("applicableCategories", "name")
			.populate("excludedProducts", "name")
			.populate("excludedCategories", "name");
		// .populate('getYProductId', 'name');

		if (!updated) {
			return res.status(404).json({ error: "Coupon not found" });
		}
		return res.json(updated);
	} catch (err) {
		console.error("setCouponFeatured error:", err);
		return res.status(500).json({ error: err.message });
	}
};
