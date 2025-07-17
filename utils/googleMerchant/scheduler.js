// lib/google-merchant/feed-generator.js

const Product = require('../model/Product');
const { getGoogleMerchantConfig } = require('./config');

/**
 * Generate a flat array of products ready for a GMC feed.
 */
async function generateProductFeed() {
	const config = await getGoogleMerchantConfig();
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://controlshift.ae';
	const defaultCurrency = config?.defaultCurrency || 'USD';

	const products = await Product.find({ status: 'active' })
		.populate('category')
		.lean();

	return products.map((prod) => {
		const mapped = {
			id: prod._id.toString(),
			title: prod.name || '',
			description: prod.shortDescription || prod.description || '',
			link: `${siteUrl}/products/${prod.slug}`,
			availability: (prod.stock || 0) > 0 ? 'in stock' : 'out of stock',
			price: prod.price || prod.mrp || prod.costPrice || 0,
			currency: defaultCurrency,
			brand: prod.brand || '',
			gtin: prod.barcode || '',
			mpn: prod.sku || '',
			condition: prod.condition || 'new',
			google_product_category: prod.googleProductCategory || '',
			product_type:
				prod.category && prod.category.name
					? prod.category.name
					: String(prod.category),
		};

		// primary image
		if (prod.thumbnail) {
			mapped.image_link = prod.thumbnail;
		} else if (Array.isArray(prod.images) && prod.images.length) {
			const first = prod.images[0];
			mapped.image_link =
				typeof first === 'string' ? first : first.url || first.src || '';
		}

		// additional images
		if (Array.isArray(prod.images) && prod.images.length > 1) {
			mapped.additional_image_link = prod.images
				.slice(mapped.image_link ? 1 : 0)
				.map((img) =>
					typeof img === 'string' ? img : img.url || img.src || ''
				)
				.filter(Boolean);
		}

		return mapped;
	});
}

/**
 * Generate XML RSS feed for GMC.
 */
async function generateXmlFeed() {
	const products = await generateProductFeed();
	const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Store';
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

	let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
	xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
	xml += `<channel>\n`;
	xml += `<title>${siteName}</title>\n`;
	xml += `<link>${siteUrl}</link>\n`;
	xml += `<description>Product feed for Google Merchant Center</description>\n`;

	const escape = (str) =>
		String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');

	for (const prod of products) {
		xml += `<item>\n`;
		for (const [k, v] of Object.entries(prod)) {
			if (v == null || v === '') continue;
			if (Array.isArray(v)) {
				v.forEach((val) => (xml += `<g:${k}>${escape(val)}</g:${k}>\n`));
			} else {
				xml += `<g:${k}>${escape(v)}</g:${k}>\n`;
			}
		}
		xml += `</item>\n`;
	}

	xml += `</channel>\n`;
	xml += `</rss>\n`;
	return xml;
}

/**
 * Generate CSV feed for GMC.
 */
async function generateCsvFeed() {
	const products = await generateProductFeed();
	const headers = [
		'id',
		'title',
		'description',
		'link',
		'image_link',
		'additional_image_link',
		'availability',
		'price',
		'currency',
		'brand',
		'gtin',
		'mpn',
		'condition',
		'google_product_category',
		'product_type',
	];

	const escapeCsv = (val) => {
		if (val == null) return '';
		const s = String(val);
		if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
		return s;
	};

	let csv = headers.join(',') + '\n';
	for (const p of products) {
		const row = headers.map((h) => {
			if (h === 'additional_image_link' && Array.isArray(p[h])) {
				return escapeCsv(p[h].join(';'));
			}
			return escapeCsv(p[h]);
		});
		csv += row.join(',') + '\n';
	}
	return csv;
}

module.exports = {
	generateProductFeed,
	generateXmlFeed,
	generateCsvFeed,
};
