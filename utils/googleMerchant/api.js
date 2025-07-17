import fetch from "node-fetch"; // Optional if you're on Node 18+ (native fetch)
import path from "path";
import { getGoogleMerchantToken } from "./auth.js";
import { getGoogleMerchantConfig } from "./config.js";
import Product from "../../model/Product.js";


// Base URL for Google Content API
const CONTENT_API_BASE = "https://www.googleapis.com/content/v2.1";

/**
 * Build auth headers for Google Merchant API.
 */
export async function getAuthHeaders() {
    const token = await getGoogleMerchantToken();
    if (!token || !token.access_token) {
        throw new Error("Not authenticated with Google Merchant Center");
    }
    return {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
    };
}

/**
 * Fetch your configured merchant ID.
 */
export async function getMerchantId() {
    const cfg = await getGoogleMerchantConfig();
    return cfg && cfg.merchantId ? cfg.merchantId : null;
}

/**
 * Fetch a single product from GMC.
 */
export async function getProduct(productId) {
    const merchantId = await getMerchantId();
    if (!merchantId) throw new Error("Merchant ID not configured");

    const headers = await getAuthHeaders();
    const url = `${CONTENT_API_BASE}/${merchantId}/products/${encodeURIComponent(
        productId,
    )}`;
    const res = await fetch(url, { headers });

    if (res.status === 404) return null;
    if (!res.ok) {
        const txt = await res.text();
        console.error("Error getting product:", txt);
        return null;
    }
    return res.json();
}

/**
 * Insert a new product into GMC.
 */
export async function insertProduct(productObj) {
    try {
        const merchantId = await getMerchantId();
        console.log("Merchant ID:", merchantId);
        if (!merchantId) throw new Error("Merchant ID not configured");

        const headers = await getAuthHeaders();
        const url = `${CONTENT_API_BASE}/${merchantId}/products`;
        console.log("Inserting product:", url);
        console.log("Product object:", productObj);
        console.log("Headers:", headers);
        console.log("Body:", JSON.stringify(productObj));
        const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(productObj),
        });
        console.log("Response:", res);
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Failed to insert product: ${txt}`);
        }
        return res.json();
    } catch (error) {
        console.error("Error inserting product 2222:", error);
        throw error;
    }
}

/**
 * Delete a product from GMC by its full API ID.
 */
export async function deleteProduct(productId) {
    const merchantId = await getMerchantId();
    if (!merchantId) throw new Error("Merchant ID not configured");

    const headers = await getAuthHeaders();
    const url = `${CONTENT_API_BASE}/${merchantId}/products/${encodeURIComponent(
        productId,
    )}`;
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to delete product: ${txt}`);
    }
    return true;
}

/**
 * Main sync: upsert all active products.
 */
// async function syncAllProducts() {
//     const merchantId = await getMerchantId();
//     if (!merchantId) throw new Error("Merchant ID not configured");

//     const config = await getGoogleMerchantConfig();
//     if (!config) throw new Error("Google Merchant not configured");
//     console.log("Syncing products to Google Merchant... ", config);
//     let products = await Product.find({ status: "active" })
//         .populate("category")
//         .lean();

//     console.log("Found", products.length, "products to sync");
//     // products = products.slice(0, 1);
//     const result = {
//         success: true,
//         totalProducts: products.length,
//         successCount: 0,
//         failureCount: 0,
//         errors: [],
//     };

//     for (const prod of products) {
//         const offerId = `product-${prod.id || prod._id}`;
//         try {
//             const formatted = formatProductForGoogleMerchant(prod, config);
//             console.log("Formatting product:", formatted);

//             const exists = await getProduct(offerId);
//             if (exists) {
//                 // update
//                 const headers = await getAuthHeaders();
//                 const url = `${CONTENT_API_BASE}/${merchantId}/products/${encodeURIComponent(
//                     offerId,
//                 )}`;
//                 const upd = await fetch(url, {
//                     method: "PUT",
//                     headers,
//                     body: JSON.stringify(formatted),
//                 });
//                 if (!upd.ok) {
//                     const txt = await upd.text();
//                     throw new Error(`Update failed: ${txt}`);
//                 }
//             } else {
//                 // insert
//                 await insertProduct(formatted);
//             }

//             result.successCount++;
//         } catch (err) {
//             console.error(`Error on product ${offerId}:`, err);
//             result.failureCount++;
//             result.errors.push({
//                 productId: offerId,
//                 error: err.message || String(err),
//             });
//         }
//     }

//     result.message = `Synced ${result.successCount}/${result.totalProducts}, ${result.failureCount} errors`;
//     return result;
// }

// Create data feed
export async function createFeed(name, fetchUrl) {
    try {
        const merchantId = await getMerchantId();
        if (!merchantId) {
            throw new Error("Merchant ID not configured");
        }

        const headers = await getAuthHeaders();
        const response = await fetch(
            `${CONTENT_API_BASE}/${merchantId}/datafeeds`,
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name,
                    contentType: "products",
                    fetchSchedule: {
                        weekday: "monday",
                        hour: 6,
                        timeZone: "America/Los_Angeles",
                        fetchUrl,
                    },
                    format: {
                        fileEncoding: "utf8",
                        columnDelimiter: "tab",
                        quotingMode: "minimal",
                    },
                }),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error creating feed:", errorText);
            throw new Error(`Failed to create feed: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error in createFeed:", error);
        throw error;
    }
}

// Get information about a specific feed
export async function getFeedInfo(feedId) {
    try {
        const merchantId = await getMerchantId();
        if (!merchantId) {
            throw new Error("Merchant ID not configured");
        }

        const headers = await getAuthHeaders();
        const response = await fetch(
            `${CONTENT_API_BASE}/${merchantId}/datafeeds/${feedId}`,
            {
                headers,
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error getting feed info:", errorText);
            throw new Error(`Failed to get feed info: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error in getFeedInfo:", error);
        throw error;
    }
}

// List all feeds
export async function listFeeds() {
    try {
        const merchantId = await getMerchantId();
        if (!merchantId) {
            throw new Error("Merchant ID not configured");
        }

        const headers = await getAuthHeaders();
        const response = await fetch(
            `${CONTENT_API_BASE}/${merchantId}/datafeeds`,
            {
                headers,
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error listing feeds:", errorText);
            throw new Error(`Failed to list feeds: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error in listFeeds:", error);
        throw error;
    }
}

// Update the syncAllProducts function to properly handle existing products
export async function syncAllProducts() {
    try {
        console.log("Starting syncAllProducts");
        const merchantId = await getMerchantId();

        if (!merchantId) {
            throw new Error("Could not determine merchant ID");
        }

        console.log(`Using merchant ID: ${merchantId}`);

        // Generate product feed
        // console.log("Generating product feed")
        // const products = await generateProductFeed()

        // Get all active products
        const products = await Product.find({ status: "active" })
            .populate("category")
            .lean();
        const config = await getGoogleMerchantConfig();
        console.log(`Found ${products.length} active products`);

        const result = {
            success: true,
            message: "Sync completed",
            totalProducts: products.length,
            successCount: 0,
            failureCount: 0,
            errors: [],
        };

        // Process each product
        for (const product of products) {
            try {
                console.log(`Processing product: ${product._id || "unknown"}`);

                // Format product for Google Content API
                const formattedProduct = formatProductForGoogleMerchant(
                    product,
                    config,
                );
                console.log({ formattedProduct });
                const productId = formattedProduct.offerId;
                console.log({ productId });
                // Check if product exists
                let existingProduct = null;
                try {
                    existingProduct = await getProduct(productId);
                } catch (error) {
                    console.log(`Error checking if product exists: ${error}`);
                    // Continue with insertion as new product
                }

                console.log({ existingProduct });

                if (existingProduct) {
                    // Update existing product
                    console.log(`Updating existing product: ${productId}`);
                    const updateResponse = await fetch(
                        `${CONTENT_API_BASE}/${merchantId}/products/${encodeURIComponent(productId)}`,
                        {
                            method: "PUT",
                            headers: await getAuthHeaders(),
                            body: JSON.stringify(formattedProduct),
                        },
                    );

                    if (!updateResponse.ok) {
                        const errorText = await updateResponse.text();
                        throw new Error(
                            `Failed to update product: ${errorText}`,
                        );
                    }
                } else {
                    // Insert new product
                    console.log(`Inserting new product: ${productId}`);
                    console.log({ product: formattedProduct });

                    await insertProduct(formattedProduct);
                }

                result.successCount++;
            } catch (error) {
                console.error(
                    `Error processing product ${product._id || "unknown"}:`,
                    error,
                );
                result.failureCount++;
                result.errors.push({
                    productId: product._id || "unknown",
                    productTitle: product.title || "Unknown Product",
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }

        // Update result message
        result.message = `Sync completed: ${result.successCount} products synced successfully, ${result.failureCount} failed`;
        console.log(result.message);

        return result;
    } catch (error) {
        console.error("Error in syncAllProducts:", error);
        return {
            success: false,
            message: `Error syncing products: ${error instanceof Error ? error.message : String(error)}`,
            totalProducts: 0,
            successCount: 0,
            failureCount: 0,
            errors: [],
        };
    }
}

/**
 * Maps product availability status based on stock level
 * @param stock Current stock quantity
 * @returns Google Merchant Center availability status
 */
function mapAvailability(stock, allowBackorders) {
    if (stock > 0) {
        return "in_stock";
    } else if (allowBackorders) {
        return "backorder";
    } else {
        return "out_of_stock";
    }
}
/**
 * Maps product condition to Google Merchant Center format
 * @param condition Product condition
 * @returns Standardized condition value
 */
function mapCondition(condition) {
    const validConditions = ["new", "refurbished", "used"];
    return validConditions.includes(condition?.toLowerCase())
        ? condition.toLowerCase()
        : "new";
}

// sd

// Add a function to delete all products
export async function deleteAllProducts() {
    try {
        const merchantId = await getMerchantId();
        if (!merchantId) {
            throw new Error("Merchant ID not configured");
        }

        const headers = await getAuthHeaders();

        // First, list all products
        const response = await fetch(
            `${CONTENT_API_BASE}/${merchantId}/products`,
            {
                headers,
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to list products: ${errorText}`);
        }

        const data = await response.json();
        console.log("data   data", data);
        const products = data.resources || [];

        console.log(`Found ${products.length} products to delete`);

        const result = {
            success: true,
            totalProducts: products.length,
            deletedCount: 0,
            failedCount: 0,
            errors: [],
        };

        // Delete each product
        for (const product of products) {
            try {
                // Get the actual productId (offerId) from the product
                // The Google Content API returns products with an ID in the format: online:en:US:{offerId}
                // We need to either use the full ID as is, or extract just the offerId part

                // Option 1: Use the full Content API ID (preferred)
                const productId = product.id;

                // Option 2: If you need to use just the offerId
                // const productId = product.offerId;

                console.log(`Deleting product with ID: ${productId}`);

                // Use the existing deleteProduct function which now formats the ID correctly
                await deleteProduct(productId);

                result.deletedCount++;
            } catch (error) {
                console.error(`Error deleting product:`, error);
                result.failedCount++;
                result.errors.push({
                    productId: product.id || product.offerId || "unknown",
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }

        result.success = result.failedCount === 0;
        return result;
    } catch (error) {
        console.error("Error in deleteAllProducts:", error);
        return {
            success: false,
            message: `Error deleting products: ${error instanceof Error ? error.message : String(error)}`,
            totalProducts: 0,
            deletedCount: 0,
            failedCount: 0,
            errors: [],
        };
    }
}

/**
 * Formats a product for Google Merchant Center based on configuration
 * @param product Product data from database
 * @param config Google Merchant Center configuration
 * @returns Formatted product for Google Merchant Center
 */
function formatProductForGoogleMerchant(product, config) {
    console.log("Formatting product:", product);
    console.log("Config:", config);
    const CURRENCY = config.defaultCurrency || "USD";
    const DOMAIN = config.domain || "controlshift.ae";

    // Extract category name if category is an object
    const categoryName =
        product.category && typeof product.category === "object"
            ? product.category.name
            : typeof product.category === "string"
              ? product.category
              : "";

    // Format price correctly with decimal precision
    const price = {
        value: Number(product.price).toFixed(2),
        currency: CURRENCY,
    };

    // Format sale price if applicable
    const salePrice =
        product.mrp && product.mrp > product.price
            ? {
                  value: Number(product.price).toFixed(2),
                  currency: CURRENCY,
              }
            : undefined;

    // Include original price as regular price if on sale
    const regularPrice = salePrice
        ? {
              value: Number(product.mrp).toFixed(2),
              currency: CURRENCY,
          }
        : undefined;

    const formattedProduct = {
        // Required fields
        offerId: `product-${product._id}`,
        title: product.title || product.name || "Untitled Product",
        description:
            product.shortDescription ||
            product.description ||
            "No description available",
        link: `https://${DOMAIN}/products/${product.slug || product._id}`,
        imageLink: product.thumbnail || product.images[0],
        price: price,
        brand: product.brand || "",
        contentLanguage: config.defaultLanguage || "en",
        targetCountry: config.defaultCountry || "US",
        channel: "online",
        availability: mapAvailability(product.stock, product.allowBackorders),

        // Recommended fields
        brand: product.brand || "",
        gtin: product[config.attributeMapping.gtin] || null,
        mpn: product.sku || "",
        condition: mapCondition(product.condition),
        googleProductCategory: product.googleProductCategory || "",
        productTypes: [categoryName].filter(Boolean),

        // Optional fields
        additionalImageLinks:
            product.images && Array.isArray(product.images)
                ? product.images
                      .slice(0, 10)
                      .map((img) =>
                          typeof img === "string"
                              ? img
                              : img.url || img.src || "",
                      )
                : [],
    };

    if (product.specifications) {
        formattedProduct.customAttributes = Object.entries(
            product.specifications,
        ).map(([key, value]) => ({
            name: key,
            value: value,
        }));
    }

    // Add sale price if applicable
    if (salePrice) {
        formattedProduct.salePrice = salePrice;
        formattedProduct.salePriceEffectiveDate = `${new Date().toISOString().split("T")[0]}/${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}`;
    }

    // Add shipping information if available in config
    if (config.defaultShipping) {
        formattedProduct.shipping = [
            {
                service: config.defaultShipping.service,
                price: {
                    value: Number(config.defaultShipping.price).toFixed(2),
                    currency: config.defaultShipping.currency || CURRENCY,
                },
                country: config.defaultCountry || "US",
            },
        ];
    }

    // Add tax information if available in config
    // if (config.defaultTax) {
    //   formattedProduct.tax = {
    //     rate: config.defaultTax.rate,
    //     country: config.defaultTax.country,
    //     region: config.defaultTax.region || ""
    //   };
    // }

    // Add weight if available
    if (product.weight && product.weight.value) {
        formattedProduct.shippingWeight = {
            value: product.weight.value,
            unit: product.weight.unit || "kg",
        };
    }

    // Add dimensions if available
    if (
        product.dimensions &&
        product.dimensions.length &&
        product.dimensions.width &&
        product.dimensions.height
    ) {
        formattedProduct.shippingLength = {
            value: product.dimensions.length,
            unit: product.dimensions.unit || "cm",
        };
        formattedProduct.shippingWidth = {
            value: product.dimensions.width,
            unit: product.dimensions.unit || "cm",
        };
        formattedProduct.shippingHeight = {
            value: product.dimensions.height,
            unit: product.dimensions.unit || "cm",
        };
    }

    // Handle variants if present
    if (product.variants && product.variants.length > 0) {
        // For products with variants, create item group ID
        formattedProduct.itemGroupId = `group-${product._id}`;
    }

    return formattedProduct;
}


