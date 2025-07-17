// utils/import-config.js

/**
 * Configuration file for entity import settings
 *
 * This file defines which fields should be imported for each entity type,
 * provides field mappings, and sets validation rules for imports.
 */

const importConfig = {
	products: {
		identifierFields: ['_id', 'sku', 'slug'],
		fields: {
			name: {
				required: true,
				validate: (value) =>
					value && value.length > 0 ? true : 'Product name is required',
			},
			shortDescription: {},
			description: {},
			sku: {},
			slug: {
				transform: (value) =>
					value
						? value
								.toLowerCase()
								.replace(/\s+/g, '-')
								.replace(/[^a-z0-9-]/g, '')
						: undefined,
			},
			price: {
				type: 'number',
				validate: (value) => (value >= 0 ? true : 'Price cannot be negative'),
			},
			mrp: { type: 'number' },
			costPrice: { type: 'number' },
			stock: { type: 'number', default: 0 },
			category: {},
			brand: {},
			tags: { type: 'array' },
			status: {
				validate: (value) =>
					['active', 'draft', 'inactive'].includes(value)
						? true
						: 'Invalid status',
			},
			barcode: {},
			id: {},
			weight: { type: 'number' },
			dimensions: {},
			featured: { type: 'boolean', default: false },
			thumbnail: {},
			images: { type: 'array' },
			attributes: { type: 'object' },
			variants: { type: 'array' },
			_id: { ignore: true },
			createdAt: { ignore: true },
			updatedAt: { ignore: true },
		},
		defaultForOtherFields: 'ignore',
	},

	categories: {
		identifierFields: ['_id', 'slug'],
		fields: {
			name: { required: true },
			description: {},
			slug: {
				transform: (value) =>
					value
						? value
								.toLowerCase()
								.replace(/\s+/g, '-')
								.replace(/[^a-z0-9-]/g, '')
						: undefined,
			},
			image: {},
			status: {},
			parent: {},
			_id: { ignore: true },
			createdAt: { ignore: true },
			updatedAt: { ignore: true },
		},
		defaultForOtherFields: 'ignore',
	},

	orders: {
		identifierFields: ['_id', 'orderId'],
		fields: {
			orderId: {},
			customer: { required: true },
			items: { type: 'array', required: true },
			total: { type: 'number' },
			subtotal: { type: 'number' },
			tax: { type: 'number' },
			shipping: { type: 'number' },
			discount: { type: 'number' },
			paymentMethod: {},
			paymentStatus: {},
			orderStatus: {},
			shippingAddress: { type: 'object' },
			billingAddress: { type: 'object' },
			_id: { ignore: true },
			createdAt: { ignore: true },
			updatedAt: { ignore: true },
		},
		defaultForOtherFields: 'ignore',
	},

	coupons: {
		identifierFields: ['_id', 'code'],
		fields: {
			code: { required: true },
			discount: { type: 'number' },
			percentageDiscount: { type: 'number' },
			maxAmount: { type: 'number' },
			minPurchase: { type: 'number' },
			maxApplicable: { type: 'number' },
			appliedTillNow: { type: 'number' },
			expiryOn: { type: 'date' },
			status: {},
			_id: { ignore: true },
			createdAt: { ignore: true },
			updatedAt: { ignore: true },
		},
		defaultForOtherFields: 'ignore',
	},

	banners: {
		identifierFields: ['_id'],
		fields: {
			title: {},
			subtitle: {},
			image: {},
			mobileImage: {},
			url: {},
			buttonText: {},
			position: {},
			status: {},
			_id: { ignore: true },
			createdAt: { ignore: true },
			updatedAt: { ignore: true },
		},
		defaultForOtherFields: 'ignore',
	},

	announcements: {
		identifierFields: ['_id'],
		fields: {
			text: { required: true },
			url: {},
			type: {},
			status: {},
			priority: { type: 'number' },
			_id: { ignore: true },
			createdAt: { ignore: true },
			updatedAt: { ignore: true },
		},
		defaultForOtherFields: 'ignore',
	},

	offers: {
		identifierFields: ['_id', 'code'],
		fields: {
			code: { required: true },
			title: { required: true },
			description: {},
			percentDiscount: { type: 'number' },
			fixedDiscount: { type: 'number' },
			minPurchase: { type: 'number' },
			maxDiscount: { type: 'number' },
			validFrom: { type: 'date' },
			validTo: { type: 'date' },
			status: {},
			_id: { ignore: true },
			createdAt: { ignore: true },
			updatedAt: { ignore: true },
		},
		defaultForOtherFields: 'ignore',
	},
};

/**
 * Process an imported entity according to its configuration.
 * @param {object} data
 * @param {string} entityType
 * @returns {{ processedData: object, validationErrors: string[] }}
 */
function processEntityWithConfig(data, entityType) {
	const config = importConfig[entityType];
	if (!config) {
		return {
			processedData: data,
			validationErrors: ['No import configuration found for this entity type'],
		};
	}

	const processedData = {};
	const validationErrors = [];

	Object.entries(config.fields).forEach(([fieldName, fieldConfig]) => {
		if (fieldConfig.ignore) return;

		let value = data[fieldName];
		if (value === undefined && fieldConfig.default !== undefined) {
			value = fieldConfig.default;
		}

		if (
			fieldConfig.required &&
			(value === undefined || value === null || value === '')
		) {
			validationErrors.push(
				`Required field '${fieldName}' is missing or empty`
			);
			return;
		}

		if (fieldConfig.validate && value !== undefined) {
			const result = fieldConfig.validate(value);
			if (result !== true) {
				validationErrors.push(
					typeof result === 'string'
						? result
						: `Validation failed for field '${fieldName}'`
				);
				return;
			}
		}

		if (fieldConfig.transform && value !== undefined) {
			value = fieldConfig.transform(value);
		}

		const targetField = fieldConfig.mapTo || fieldName;
		if (value !== undefined) {
			processedData[targetField] = value;
		}
	});

	if (config.defaultForOtherFields === 'import') {
		Object.entries(data).forEach(([key, val]) => {
			if (!config.fields[key] && val !== undefined) {
				processedData[key] = val;
			}
		});
	}

	if (config.validateEntity) {
		const entityValidation = config.validateEntity(processedData);
		if (entityValidation !== true) {
			validationErrors.push(
				typeof entityValidation === 'string'
					? entityValidation
					: 'Entity validation failed'
			);
		}
	}

	return { processedData, validationErrors };
}

module.exports = {
	importConfig,
	processEntityWithConfig,
};
