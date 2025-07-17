import mongoose from "mongoose";
const { Schema } = mongoose;
const OfferSchema = new Schema(
	{
		title: { type: String, required: true, trim: true },
		description: { type: String, required: true, trim: true },
		shortDescription: { type: String, trim: true },

		type: {
			type: String,
			enum: ['percentage', 'fixed', 'bundle', 'bogo', 'free_gift'],
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

		// Validity
		isActive: { type: Boolean, default: true },
		startDate: { type: Date, default: Date.now },
		endDate: { type: Date, required: true },

		// Target
		target: {
			type: String,
			enum: ['products', 'categories', 'collections'],
			default: 'products',
		},
		targetProducts: [{ type: Schema.Types.ObjectId, ref: 'products' }],
		targetCategories: [{ type: Schema.Types.ObjectId, ref: 'categories' }],

		// Bundle
		bundleProducts: [{ type: Schema.Types.ObjectId, ref: 'products' }],
		bundlePrice: { type: Number, min: 0 },

		// BOGO
		buyQuantity: { type: Number, min: 1, default: 1 },
		getQuantity: { type: Number, min: 1, default: 1 },

		// Free Gift
		giftProductId: { type: Schema.Types.ObjectId, ref: 'products' },
		minPurchaseAmount: { type: Number, default: 0, min: 0 },

		// Display options
		displayType: [
			{ type: String, enum: ['banner', 'badge', 'popup', 'highlight'] },
		],
		positions: [
			{
				type: String,
				enum: [
					'home',
					'product_page',
					'category_page',
					'cart_page',
					'checkout_page',
				],
			},
		],
		priority: { type: Number, default: 0 },

		// Media
		image: { type: String },
		bannerImage: { type: String },

		// Additional info
		termsAndConditions: { type: String },
		status: {
			type: String,
			enum: ['active', 'expired', 'disabled', 'scheduled'],
			default: 'active',
		},
		featured: { type: Boolean, default: false },

		// Usage
		viewCount: { type: Number, default: 0 },
		clickCount: { type: Number, default: 0 },
		conversionCount: { type: Number, default: 0 },

		// Metadata
		createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
		updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
	},
	{ timestamps: true }
);

// Pre-save hook to update status based on dates
OfferSchema.pre('save', function (next) {
	const now = new Date();

	if (this.endDate < now) {
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

// Method: isValid
OfferSchema.methods.isValid = function () {
	const now = new Date();
	return (
		this.isActive &&
		this.status === 'active' &&
		now >= this.startDate &&
		now <= this.endDate
	);
};

// Method: calculateDiscount
OfferSchema.methods.calculateDiscount = function (productPrice, quantity = 1) {
	if (!this.isValid()) return 0;

	let discountAmount = 0;

	switch (this.type) {
		case 'percentage':
			discountAmount = ((productPrice * this.value) / 100) * quantity;
			break;
		case 'fixed':
			discountAmount = Math.min(this.value * quantity, productPrice * quantity);
			break;
		case 'bundle':
			// Calculated at cart level
			break;
		case 'bogo':
			if (quantity >= this.buyQuantity) {
				const sets = Math.floor(
					quantity / (this.buyQuantity + this.getQuantity)
				);
				const remainder = quantity % (this.buyQuantity + this.getQuantity);
				const freeItems =
					sets * this.getQuantity + Math.max(0, remainder - this.buyQuantity);
				discountAmount = productPrice * freeItems;
			}
			break;
		case 'free_gift':
			// Applied at cart level
			break;
	}

	return discountAmount;
};

const Offer = mongoose.model('offers', OfferSchema);
export default Offer;
