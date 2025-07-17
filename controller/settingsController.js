import  Settings from '../model/Settings.js';

// Fetch or create the full settings document
export const getAllSettings = async (req, res) => {
	try {
		let settings = await Settings.findOne({});
		if (!settings) {
			// create defaults if none exist
			settings = await Settings.create({
				general: {
					storeName: 'My Store',
					storeEmail: 'store@example.com',
					currency: 'USD',
					weightUnit: 'kg',
					dimensionUnit: 'cm',
					enableInventoryTracking: true,
					lowStockThreshold: 5,
					orderPrefix: 'ORD-',
				},
				tax: {
					enabled: true,
					calculateTaxBasedOn: 'shipping',
					pricesIncludeTax: false,
					displayPricesInStore: 'excluding',
					taxRates: [
						{
							name: 'Standard Rate',
							rate: 10,
							region: 'Default',
							isDefault: true,
						},
					],
				},
				shipping: {
					enabled: true,
					calculationType: 'flat',
					shippingOrigin: {
						address: '',
						city: '',
						state: '',
						country: '',
						zipCode: '',
					},
					shippingMethods: [
						{
							name: 'Standard Shipping',
							description: 'Delivery within 3-5 business days',
							cost: 5.99,
							freeShippingThreshold: 50,
							estimatedDeliveryDays: 5,
							isDefault: true,
							regions: ['Domestic'],
							active: true,
						},
					],
				},
				payment: {
					// default payment config can go here
				},
			});
		}
		res.json(settings);
	} catch (err) {
		console.error('getAllSettings error:', err);
		res.status(500).json({ error: 'Failed to fetch settings' });
	}
};

// Merge and save any or all sub-sections; only admin allowed
export const updateAllSettings = async (req, res) => {
	try {
		// const user = await getUserFromRequest(req);
		// if (!user || user.role !== 'admin') {
		// 	return res.status(401).json({ error: 'Unauthorized' });
		// }

		const body = req.body;
		let settings = await Settings.findOne({});
		if (!settings) {
			settings = await Settings.create(body);
		} else {
			if (body.general)
				settings.general = { ...settings.general.toObject(), ...body.general };
			if (body.tax) settings.tax = { ...settings.tax.toObject(), ...body.tax };
			if (body.shipping)
				settings.shipping = {
					...settings.shipping.toObject(),
					...body.shipping,
				};
			if (body.payment) settings.payment = body.payment;
			await settings.save();
		}

		res.json(settings);
	} catch (err) {
		console.error('updateAllSettings error:', err);
		res.status(400).json({ error: 'Failed to update settings' });
	}
};

// Tax settings
export const getTaxSettings = async (req, res) => {
	try {
		const settings = await Settings.findOne({}, 'tax').lean();
		res.json(settings?.tax || {});
	} catch (err) {
		console.error('getTaxSettings error:', err);
		res.status(500).json({ error: 'Failed to fetch tax settings' });
	}
};
export const updateTaxSettings = async (req, res) => {
	try {
		const body = req.body;
		let settings = await Settings.findOne({});
		if (!settings) {
			settings = await Settings.create({ tax: body });
		} else {
			settings.tax = body;
			await settings.save();
		}
		res.json(settings.tax);
	} catch (err) {
		console.error('updateTaxSettings error:', err);
		res.status(400).json({ error: 'Failed to update tax settings' });
	}
};

// Shipping settings
export const getShippingSettings = async (req, res) => {
	try {
		const settings = await Settings.findOne({}, 'shipping').lean();
		res.json(settings?.shipping || {});
	} catch (err) {
		console.error('getShippingSettings error:', err);
		res.status(500).json({ error: 'Failed to fetch shipping settings' });
	}
};
export const updateShippingSettings = async (req, res) => {
	try {
		const body = req.body;
		let settings = await Settings.findOne({});
		if (!settings) {
			settings = await Settings.create({ shipping: body });
		} else {
			settings.shipping = body;
			await settings.save();
		}
		res.json(settings.shipping);
	} catch (err) {
		console.error('updateShippingSettings error:', err);
		res.status(400).json({ error: 'Failed to update shipping settings' });
	}
};

// Payment settings
export const getPaymentSettings = async (req, res) => {
	try {
		const settings = await Settings.findOne({}, 'payment').lean();
		res.json(settings?.payment || {});
	} catch (err) {
		console.error('getPaymentSettings error:', err);
		res.status(500).json({ error: 'Failed to fetch payment settings' });
	}
};
export const updatePaymentSettings = async (req, res) => {
	try {
		const body = req.body;
		let settings = await Settings.findOne({});
		if (!settings) {
			settings = await Settings.create({ payment: body });
		} else {
			settings.payment = body;
			await settings.save();
		}
		res.json(settings.payment);
	} catch (err) {
		console.error('updatePaymentSettings error:', err);
		res.status(400).json({ error: 'Failed to update payment settings' });
	}
};

// General settings (stand-alone)
export const getGeneralSettings = async (req, res) => {
	try {
		const settings = await Settings.findOne({}, 'general').lean();
		res.json(settings?.general || {});
	} catch (err) {
		console.error('getGeneralSettings error:', err);
		res.status(500).json({ error: 'Failed to fetch general settings' });
	}
};
export const updateGeneralSettings = async (req, res) => {
	try {
		const body = req.body;
		let settings = await Settings.findOne({});
		if (!settings) {
			settings = await Settings.create({ general: body });
		} else {
			settings.general = body;
			await settings.save();
		}
		res.json(settings.general);
	} catch (err) {
		console.error('updateGeneralSettings error:', err);
		res.status(400).json({ error: 'Failed to update general settings' });
	}
};
