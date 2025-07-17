import mongoose from "mongoose";
const { Schema } = mongoose;
// Tax Rate Schema
// const TaxRateSchema = new Schema({
//   name: { type: String, required: true },
//   rate: { type: Number, required: true, min: 0 },
//   region: { type: String, required: true },
//   isDefault: { type: Boolean, default: false },
// })
// Payment Method Schema
const PaymentMethodSchema = new Schema({
	name: { type: String, required: true },
	key: { type: String, required: true, match: /^[a-z0-9_-]+$/ },
	description: { type: String },
	enabled: { type: Boolean, default: true },
});

// Shipping Method Schema
const ShippingMethodSchema = new Schema({
	name: { type: String, required: true },
	description: { type: String },
	cost: { type: Number, required: true, min: 0 },
	freeShippingThreshold: { type: Number, min: 0 },
	estimatedDeliveryDays: { type: Number, min: 0 },
	isDefault: { type: Boolean, default: false },
	regions: [{ type: String }],
	active: { type: Boolean, default: true },
});

// Settings Schema
const SettingsSchema = new Schema(
	{
		general: {
			storeName: { type: String, default: 'My Store' },
			storeEmail: { type: String, default: 'store@example.com' },
			storePhone: { type: String },
			storeAddress: { type: String },
			storeCity: { type: String },
			storeState: { type: String },
			storeZip: { type: String },
			storeCountry: { type: String },
			currency: { type: String, default: 'USD' },
			weightUnit: {
				type: String,
				enum: ['kg', 'g', 'lb', 'oz'],
				default: 'kg',
			},
			dimensionUnit: {
				type: String,
				enum: ['cm', 'm', 'in', 'ft'],
				default: 'cm',
			},
			enableInventoryTracking: { type: Boolean, default: true },
			lowStockThreshold: { type: Number, default: 5 },
			orderPrefix: { type: String, default: 'ORD-' },
		},
		tax: {
			enabled: { type: Boolean, default: true },
			taxRate: { type: Number, min: 0, default: 5 }, // Default UAE VAT is 5%
			pricesIncludeTax: { type: Boolean, default: false },
			// Keeping these fields for backward compatibility
			// calculateTaxBasedOn: { type: String, enum: ["shipping", "billing", "store"], default: "shipping" },
			// displayPricesInStore: { type: String, enum: ["including", "excluding", "both"], default: "excluding" },
			// taxRates: [TaxRateSchema],
		},
		shipping: {
			enabled: { type: Boolean, default: true },
			calculationType: {
				type: String,
				enum: ['flat', 'weight', 'price'],
				default: 'flat',
			},
			shippingOrigin: {
				address: { type: String },
				city: { type: String },
				state: { type: String },
				country: { type: String },
				zipCode: { type: String },
			},
			shippingMethods: [ShippingMethodSchema],
		},
		payment: {
			methods: [PaymentMethodSchema],
		},
	},
	{ timestamps: true }
);

// Ensure only one settings document exists
SettingsSchema.statics.findOneOrCreate = async function () {
	const settings = await this.findOne({});
	if (settings) {
		return settings;
	}
	return this.create({});
};

// Create or get the model
const Settings = mongoose.model('settings', SettingsSchema);

export default Settings;
