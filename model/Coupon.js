import mongoose from "mongoose";
import ('./Category.js'); // ensure Category model is registered
import ('./Product.js'); // ensure Category model is registered

const { Schema } = mongoose;

// Coupon schema
const CouponSchema = new Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true,
			index: true,
		},
		type: {
			type: String,
			enum: ['percentage', 'fixed', 'free_shipping', 'buy_x_get_y'],
			default: 'percentage',
		},
		value: {
			type: Number,
			required: true,
			min: 0,
			validate: {
				validator: function (val) {
					return !(this.type === 'percentage' && val > 100);
				},
				message: 'Percentage discount cannot exceed 100%',
			},
		},
		minPurchaseAmount: { type: Number, default: 0, min: 0 },
		maxDiscountAmount: { type: Number, default: 0, min: 0 },

		isActive: { type: Boolean, default: true },
		startDate: { type: Date, default: Date.now },
		expiryDate: { type: Date, required: true },

		usageLimit: { type: Number, default: 0, min: 0 },
		perCustomerLimit: { type: Number, default: 0, min: 0 },
		usageCount: { type: Number, default: 0, min: 0 },
		usedBy: [{ type: String }],

		applicability: {
			type: String,
			enum: ['all', 'products', 'categories', 'customers'],
			default: 'all',
		},
		applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'products' }],
		applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'categories' }],
		excludedProducts: [{ type: Schema.Types.ObjectId, ref: 'products' }],
		excludedCategories: [{ type: Schema.Types.ObjectId, ref: 'categories' }],

		customerType: {
			type: String,
			enum: ['all', 'new', 'returning', 'vip'],
			default: 'all',
		},
		customerGroups: [{ type: String }],
		firstPurchaseOnly: { type: Boolean, default: false },

		// buyXQuantity: { type: Number, default: 0, min: 0 },
		// getYQuantity: { type: Number, default: 0, min: 0 },
		// getYProductId: { type: Schema.Types.ObjectId, ref: 'products' },

		daysOfWeek: [{ type: Number, min: 0, max: 6 }],
		hoursOfDay: {
			start: { type: Number, min: 0, max: 23, default: 0 },
			end: { type: Number, min: 0, max: 23, default: 23 },
		},

		canCombineWithOtherCoupons: { type: Boolean, default: false },

		description: { type: String, default: '' },
		status: {
			type: String,
			enum: ['active', 'expired', 'disabled', 'scheduled'],
			default: 'active',
		},
		featured: { type: Boolean, default: false, index: true },

		createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
		updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
	},
	{ timestamps: true }
);

// Pre-save hook
CouponSchema.pre('save', function (next) {
	const now = new Date();
	if (this.expiryDate < now) {
		this.status = 'expired';
		this.isActive = false;
	} else if (this.startDate > now) {
		this.status = 'scheduled';
	} else if (this.status === 'active') {
		this.isActive = true;
	}

	if (this.type === 'percentage' && this.value > 100) {
		this.value = 100;
	}

	next();
});

// Model export
const Coupon = mongoose.model('coupons', CouponSchema);
export default Coupon;
