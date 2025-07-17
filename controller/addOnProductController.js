import mongoose from "mongoose";
import AddOnProduct from "../model/AddOnProduct.js";
import slugify from "slugify";

// GET /addons?page=1&limit=10&status=active&featured=true
export const listProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const filter = {};

        if (req.query.status) filter.status = req.query.status;
        if (req.query.featured) filter.featured = req.query.featured === "true";

        const [products, totalProducts] = await Promise.all([
            AddOnProduct.find(filter)
                .populate("category", "name _id")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AddOnProduct.countDocuments(filter),
        ]);

        return res.json({
            products,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
        });
    } catch (err) {
        console.error("listProducts error:", err);
        return res.status(500).json({ error: "Failed to fetch products" });
    }
};

export const getRecommendedProducts = async (req, res) => {
    try {
        const { productName } = req.query;
        let originalProduct = null;

        if (productName) {
            const regex = new RegExp(productName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
            originalProduct = await AddOnProduct.findOne({ name: regex }).lean();
        }

        if (!originalProduct) return res.json([]);

        const categoryId = originalProduct.category;
        let recommendedProducts = await AddOnProduct.find({
            category: categoryId,
            _id: { $ne: originalProduct._id },
        }).limit(10).lean();

        if (recommendedProducts.length < 10) {
            const existingIds = recommendedProducts.map(p => p._id);
            existingIds.push(originalProduct._id);

            const recentProducts = await AddOnProduct.find({
                _id: { $nin: existingIds },
            }).sort({ createdAt: -1 })
              .limit(10 - recommendedProducts.length)
              .lean();

            recommendedProducts = [...recommendedProducts, ...recentProducts];
        }

        return res.json(recommendedProducts);
    } catch (err) {
        console.error("getRecommendedProducts error:", err);
        return res.status(500).json({ error: "Failed to fetch recommended products" });
    }
};

export const createProduct = async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).json({ error: "Name is required" });
        }

        // Slug auto-generation
        if (!req.body.slug || req.body.slug.trim() === "") {
            req.body.slug = slugify(req.body.name, { lower: true, strict: true });
        }

        // Ensure default structure for optional fields
        req.body.seo = req.body.seo || {};
        req.body.metadata = req.body.metadata || {};
        req.body.images = req.body.images || [];
        req.body.videos = req.body.videos || [];

        const product = await AddOnProduct.create(req.body);
        console.log("Using model:", AddOnProduct.modelName); // Should log "AddOnProduct"
        console.log("Saving to collection:", AddOnProduct.collection.collectionName); // Should log "addonproducts"



        return res.status(201).json({
            success: true,
            product,
        });
    } catch (err) {
        console.error("createProduct error:", err);
        return res.status(400).json({ error: err.message || "Failed to create product" });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await AddOnProduct.findById(req.params.id).populate("category", "name _id").lean();
        if (!product) return res.status(404).json({ error: "Product not found" });
        return res.json(product);
    } catch (err) {
        console.error("getProductById error:", err);
        return res.status(500).json({ error: "Failed to fetch product" });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const updated = await AddOnProduct.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: "Product not found" });
        return res.json({ success: true, product: updated });
    } catch (err) {
        console.error("updateProduct error:", err);
        return res.status(400).json({ error: err.message || "Failed to update product" });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const deleted = await AddOnProduct.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Product not found" });
        return res.json({ success: true });
    } catch (err) {
        console.error("deleteProduct error:", err);
        return res.status(500).json({ error: "Failed to delete product" });
    }
};

export const verifyPurchase = async (req, res) => {
    try {
        // TODO: Implement actual verification logic
        return res.json({ verified: true });
    } catch (err) {
        console.error("verifyPurchase error:", err);
        return res.status(500).json({ error: "Failed to verify purchase" });
    }
};
