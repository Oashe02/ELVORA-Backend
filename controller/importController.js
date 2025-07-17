import csv  from 'csv-parser';
import { Readable } from 'stream';
import  Product from '../model/Product.js';

const modelMap = {
	products: Product,
};

export const importEntities = async (req, res) => {
	const { entity } = req.body;
	const file = req.file;

	if (!file) {
		return res.status(400).json({ error: 'No file provided' });
	}
	if (!entity || !modelMap[entity]) {
		return res.status(400).json({ error: 'Invalid entity type' });
	}

	if (entity !== 'products') {
		return res
			.status(400)
			.json({ error: `Import for entity '${entity}' is not yet supported.` });
	}

	try {
		const ext = file.originalname.split('.').pop().toLowerCase();
		let itemsData = [];
		if (ext === 'json') {
			try {
				itemsData = JSON.parse(file.buffer.toString());
				if (!Array.isArray(itemsData)) itemsData = [itemsData];
			} catch (e) {
				return res.status(400).json({ error: 'Invalid JSON format.' });
			}
		} else if (ext === 'csv') {
			try {
				itemsData = await new Promise((resolve, reject) => {
					const results = [];
					Readable.from(file.buffer)
						.pipe(csv())
						.on('data', (data) => results.push(data))
						.on('end', () => resolve(results))
						.on('error', (error) => reject(error));
				});
			} catch (e) {
				return res.status(400).json({ error: 'Failed to parse CSV file.' });
			}
		} else {
			return res
				.status(400)
				.json({ error: 'Unsupported file type. Please use CSV or JSON.' });
		}
		const results = {
			total: itemsData.length,
			imported: 0,
			updated: 0,
			failed: 0,
			errors: [],
		};

		for (const item of itemsData) {
			const itemName = item.name || item.Name || `Row ${results.imported + results.updated + results.failed + 1}`;
			try {
				const productName = item.name || item.Name;
				if (!productName) {
					throw new Error('Product "name" is a required field.');
				}

				const categoryId = item.category || item.Category || item.categoryId;
				const productData = {
					name: productName,
					slug: item.slug || item.Slug || productName.trim().toLowerCase().replace(/\s+/g, '-'),
					sku: item.sku || item.SKU,
					barcode: item.barcode || item.Barcode,
					brand: item.brand || item.Brand,
					googleProductCategory: item.googleProductCategory || item.GoogleProductCategory,
					yearFrom: item.yearFrom || item.YearFrom,
					yearTo: item.yearTo || item.YearTo,
					fuelType: item.fuelType || item.FuelType,
					bodyType: item.bodyType || item.BodyType,
					transmission: item.transmission || item.Transmission,
					drivetrain: item.drivetrain || item.Drivetrain,
					mrp: Number(item.mrp || item.MRP) || 0,
					price: Number(item.price || item.Price) || 0,
					costPrice: Number(item.costPrice || item.CostPrice) || 0,
					stock: Number(item.stock || item.Stock) || 0,
					sold: Number(item.sold || item.Sold) || 0,
					lowStockThreshold: Number(item.lowStockThreshold || item.LowStockThreshold) || 0,
					shortDescription: item.shortDescription || item.ShortDescription,
					description: item.description || item.Description,
					thumbnail: item.thumbnail || item.Thumbnail,
					tax: Number(item.tax || item.Tax) || 0,
					priority: Number(item.priority || item.Priority) || 10,
					// status: (item.status || item.Status || 'draft').toLowerCase(), // Default status is 'draft'
					status:"draft",
					featured: /true/i.test(item.featured) || /true/i.test(item.Featured),
					allowBackorders: /true/i.test(item.allowBackorders) || /true/i.test(item.AllowBackorders),
				};
                
                const complexFields = {
                    oemNumbers: 'array', manufacturerPartNumbers: 'array', manufacturer: 'array',
                    makeId: 'array', modelId: 'array', images: 'array', videos: 'array',
                    tags: 'array', relatedProducts: 'array', dimensions: 'object',
                    weight: 'object', variants: 'object', seo: 'object',
                    specifications: 'object', metadata: 'object'
                };

                for (const field in complexFields) {
                    const value = item[field] || item[field.charAt(0).toUpperCase() + field.slice(1)];
                    if (value) {
                        try {
                            if (complexFields[field] === 'array') {
                                let parsedArray = [];
                                const stringValue = String(value);
                                if (Array.isArray(value)) {
                                    parsedArray = value;
                                } else if (stringValue.startsWith('[') && stringValue.endsWith(']')) {
                                    parsedArray = stringValue.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, '')).filter(Boolean);
                                } else {
                                    parsedArray = stringValue.split(',').map(v => v.trim()).filter(Boolean);
                                }
                                productData[field] = parsedArray;
                            } else if (complexFields[field] === 'object') {
                                productData[field] = typeof value === 'object' ? value : JSON.parse(value);
                            }
                        } catch (e) { /* ignore invalid data */ }
                    }
                }

				const existingProduct = await Product.findOne({
					name: { $regex: `^${productData.name}$`, $options: 'i' },
				});

                Object.keys(productData).forEach(key => productData[key] === undefined && delete productData[key]);

				if (existingProduct) {
                    if (categoryId) {
                        productData.category = categoryId;
                    }
					await Product.updateOne({ _id: existingProduct._id }, { $set: productData });
					results.updated++;
				} else {
                    if (!categoryId) {
                        throw new Error('Product "category" ID is a required field and was not provided.');
                    }
                    productData.category = categoryId;
					await Product.create(productData);
					results.imported++;
				}
			} catch (err) {
				results.failed++;
				results.errors.push(`Item "${itemName}": ${err.message}`);
			}
		}

		console.log("Import summary:", results);

		return res.json(results);
	} catch (err) {
		console.error('Import Error:', err);
		return res.status(500).json({ error: 'An unexpected error occurred during import.' });
	}
};










