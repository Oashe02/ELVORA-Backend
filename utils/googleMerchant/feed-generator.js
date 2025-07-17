// lib/google-merchant/feed-generator.js

const Product = require("../model/Product");
const { getGoogleMerchantConfig } = require("./config");

/**
 * Generate a product feed for Google Merchant Center
 */
async function generateProductFeed() {
    const config = await getGoogleMerchantConfig();
    console.log("Generating product feed for Google Merchant");

    const products = await Product.find({ status: "active" })
        .populate("category")
        .lean();
    console.log(`Found ${products.length} active products`);

    const defaultUrl =
        config?.domain || process.env.CLIENT_URL || "https://controlshift.ae";
    const merchantProducts = products.map((product) => {
        const mapped = {
            id: product._id.toString(),
            title: product.name || "",
            description: product.shortDescription || product.description || "",
            link: `${defaultUrl}/products/${product.slug}`,
            image_link:
                product.thumbnail ||
                (Array.isArray(product.images) && product.images[0]
                    ? typeof product.images[0] === "string"
                        ? product.images[0]
                        : product.images[0].url || ""
                    : ""),
            additional_image_link:
                Array.isArray(product.images) && product.images.length > 1
                    ? product.images
                          .slice(1)
                          .map((img) =>
                              typeof img === "string" ? img : img.url || "",
                          )
                    : [],
            availability:
                (product.stock || 0) > 0 ? "in stock" : "out of stock",
            price: product.price || product.mrp || product.costPrice || 0,
            currency: config?.defaultCurrency || "USD",
            brand: product.brand || "",
            gtin: product.barcode || "",
            mpn: product.sku || "",
            condition: product.condition || "new",
            google_product_category: product.googleProductCategory || "",
            product_type:
                product.category && product.category.name
                    ? product.category.name
                    : product.category || "",
        };
        return mapped;
    });

    console.log(
        `Mapped ${merchantProducts.length} products for Google Merchant`,
    );
    return merchantProducts;
}

/**
 * Generate XML feed for Google Merchant Center
 */
async function generateXmlFeed() {
    const products = await generateProductFeed();
    console.log("Building XML feed");

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml +=
        '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n<channel>\n';
    xml += `<title>${process.env.NEXT_PUBLIC_SITE_NAME || "Store"}</title>\n`;
    xml += `<link>${
        process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
    }</link>\n`;
    xml +=
        "<description>Product feed for Google Merchant Center</description>\n";

    products.forEach((prod) => {
        xml += "<item>\n";
        Object.entries(prod).forEach(([key, value]) => {
            if (value == null || value === "") return;
            if (Array.isArray(value)) {
                value.forEach((val) => {
                    xml += `<g:${key}>${escapeXml(val)}</g:${key}>\n`;
                });
            } else {
                xml += `<g:${key}>${escapeXml(value)}</g:${key}>\n`;
            }
        });
        xml += "</item>\n";
    });

    xml += "</channel>\n</rss>\n";
    return xml;
}

// Helper: escape XML special characters
function escapeXml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * Generate CSV feed
 */
async function generateCsvFeed() {
    const products = await generateProductFeed();
    const headers = [
        "id",
        "title",
        "description",
        "link",
        "image_link",
        "additional_image_link",
        "availability",
        "price",
        "currency",
        "brand",
        "gtin",
        "mpn",
        "condition",
        "google_product_category",
        "product_type",
    ];
    let csv = headers.join(",") + "\n";

    products.forEach((prod) => {
        const row = headers.map((field) => {
            let val = prod[field] || "";
            if (Array.isArray(val)) val = val.join(";");
            return escapeCsv(val);
        });
        csv += row.join(",") + "\n";
    });

    return csv;
}

// Helper: escape CSV fields
function escapeCsv(val) {
    const s = String(val);
    if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

module.exports = {
    generateProductFeed,
    generateXmlFeed,
    generateCsvFeed,
};
