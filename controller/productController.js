import mongoose from "mongoose";
import Product from "../model/Product.js";
import CarModel from "../model/CarModel.js";
import Make from "../model/Make.js";
import Manufacturer from "../model/Manufacturer.js";
import Category from "../model/Category.js";
import slugify from "slugify";



export const listProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const status = req.query.status;
        const featured = req.query.featured;
        const skip = (page - 1) * limit;
        const filter = {};

        if (status) filter.status = status;
        if (featured) filter.featured = true;

        const [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(filter),
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
            const escapedProductName = productName.replace(
                /[-\/\\^$*+?.()|[\]{}]/g,
                "\\$&",
            );
            originalProduct = await Product.findOne({
                name: { $regex: escapedProductName, $options: "i" },
            }).lean();
        }

        console.log(
            "Original Product:",
            originalProduct ? originalProduct.name : "Not Found",
        );

        let recommendedProducts = [];

        // If the product is found, try to recommend based on its category.
        if (originalProduct && originalProduct.category) {
            console.log("Original Product Category:", originalProduct.category);
            const categoryIds = Array.isArray(originalProduct.category)
                ? originalProduct.category
                : [originalProduct.category];

            console.log("Category IDs for search:", categoryIds);

            if (categoryIds.length > 0) {
                recommendedProducts = await Product.find({
                    category: { $in: categoryIds },
                    _id: { $ne: originalProduct._id },
                })
                    .limit(10)
                    .lean();

                console.log(
                    "Found",
                    recommendedProducts.length,
                    "products by category.",
                );
            }
        }

        // If we don't have enough recommendations, fill the rest with recent products.
        if (recommendedProducts.length < 10) {
            console.log(
                "Not enough recommendations, falling back to recent products.",
            );
            const limit = 10 - recommendedProducts.length;
            const existingIds = recommendedProducts.map((p) => p._id);
            if (originalProduct) {
                existingIds.push(originalProduct._id);
            }

            const recentProducts = await Product.find({
                _id: { $nin: existingIds },
            })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();

            console.log(
                "Found",
                recentProducts.length,
                "recent products to fill.",
            );
            recommendedProducts.push(...recentProducts);
        }

        return res.json(recommendedProducts);
    } catch (err) {
        console.error("getRecommendedProducts error:", err);
        return res
            .status(500)
            .json({ error: "Failed to fetch recommended products" });
    }
};

export const createProduct = async (req, res) => {
    try {
      // Auto-generate slug if missing or blank
      if (!req.body.slug || req.body.slug.trim() === "") {
        if (!req.body.name) {
          return res.status(400).json({ error: "Name is required to generate slug" });
        }
  
        req.body.slug = slugify(req.body.name, { lower: true, strict: true });
      }
  
      const product = await Product.create(req.body);
  
      return res.status(201).json({
        success: true,
        product,
      });
    } catch (err) {
      console.error("createProduct error:", err);
      return res
        .status(400)
        .json({ error: err.message || "Failed to create product" });
    }
  };

export const filterProducts = async (req, res) => {
    try {
        const {
            page = "1",
            limit = "12",
            sort = "createdAt",
            order = "desc",
            search = "",
            category,
            minPrice = "0",
            maxPrice = "999999",
            inStock,
            onSale,
            featured,
            ...rest
        } = req.query;

        const pg = parseInt(page, 10);
        const lt = parseInt(limit, 10);
        const sk = (pg - 1) * lt;
        const filter = { status: "active" };

        // text search
        if (search) {
            const re = new RegExp(search, "i");
            filter.$or = [
                { name: { $regex: re } },
                { description: { $regex: re } },
                { sku: { $regex: re } },
            ];
        }

        // category + subcategories
        if (category) {
            const cat = await Category.findOne({ slug: category }).lean();
            if (cat) {
                const catIds = [cat._id];
                const subs = await Category.find({ parent: cat._id }).lean();
                catIds.push(...subs.map((c) => c._id));
                filter.category = { $in: catIds };
            }
        }

        // price
        filter.price = {
            $gte: parseFloat(minPrice),
            $lte: parseFloat(maxPrice),
        };

        // stock / sale / featured
        if (inStock === "true") filter.stockQuantity = { $gt: 0 };
        if (onSale === "true")
            filter.salePrice = { $exists: true, $gt: 0, $lt: "$price" };
        if (featured === "true") filter.featured = true;

        // attribute filters: any query key starting with attr_
        Object.entries(rest).forEach(([k, v]) => {
            if (k.startsWith("attr_")) {
                filter[`attributes.${k.slice(5)}`] = {
                    $in: String(v).split(","),
                };
            }
        });

        // sort
        const sortOpts = {};
        if (sort === "price" || sort === "name") {
            sortOpts[sort] = order === "asc" ? 1 : -1;
        } else if (sort === "popularity") {
            sortOpts.viewCount = -1;
        } else {
            sortOpts[sort] = order === "asc" ? 1 : -1;
        }

        const [products, totalProducts, priceStats] = await Promise.all([
            Product.find(filter)
                .sort(sortOpts)
                .skip(sk)
                .limit(lt)
                .populate("category")
                .lean(),
            Product.countDocuments(filter),
            // for price range
            Product.aggregate([
                { $match: { status: "active" } },
                {
                    $group: {
                        _id: null,
                        minPrice: { $min: "$price" },
                        maxPrice: { $max: "$price" },
                    },
                },
            ]),
        ]);

        const priceRange = priceStats[0]
            ? { min: priceStats[0].minPrice, max: priceStats[0].maxPrice }
            : { min: 0, max: 0 };

        return res.json({
            products,
            pagination: {
                page: pg,
                limit: lt,
                totalProducts,
                totalPages: Math.ceil(totalProducts / lt),
            },
            filters: { priceRange },
        });
    } catch (err) {
        console.error("filterProducts error:", err);
        return res.status(500).json({ error: "Failed to filter products" });
    }
};

export const getProductAttributes = async (_, res) => {
    try {
        const attributeData = await Product.aggregate([
            { $match: { status: "active" } },
            { $unwind: "$attributes" },
            {
                $group: {
                    _id: { key: "$attributes.key", value: "$attributes.value" },
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: "$_id.key",
                    values: { $push: { value: "$_id.value", count: "$count" } },
                },
            },
            { $project: { _id: 0, name: "$_id", values: 1 } },
            { $sort: { name: 1 } },
        ]);
        return res.json(attributeData);
    } catch (err) {
        console.error("getProductAttributes error:", err);
        return res
            .status(500)
            .json({ error: "Failed to fetch product attributes" });
    }
};

export const getProductById = async (req, res) => {
    try {
        const prod = await Product.findById(req.params.id).lean();
        if (!prod) {
            return res.status(404).json({ error: "Product not found" });
        }
        return res.json(prod);
    } catch (err) {
        console.error("getProductById error:", err);
        return res.status(500).json({ error: "Failed to fetch product" });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            },
        );
        if (!updated) {
            return res.status(404).json({ error: "Product not found" });
        }
        return res.json({
            success: true,
            product: updated,
        });
    } catch (err) {
        console.error("updateProduct error:", err);
        return res.status(400).json({ error: "Failed to update product" });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Product not found" });
        }
        return res.json({ success: true });
    } catch (err) {
        console.error("deleteProduct error:", err);
        return res.status(500).json({ error: "Failed to delete product" });
    }
};

export const verifyPurchase = async (req, res) => {
    try {
        // TODO: implement real check against orders
        return res.json({ verified: true });
    } catch (err) {
        console.error("verifyPurchase error:", err);
        return res.status(500).json({ error: "Failed to verify purchase" });
    }
};

/**
 * GET /api/products/filters
 *
 * Returns sidebar filter data (facets) with counts, based on an optional search or existing filter criteria.
 * Example query params:
 *   search=brake pads
 *   categories=[...]
 *   makes=[...]
 *   models=[...]
 *   manufacturers=[...]
 *   fuelTypes=[...]
 *   bodyTypes=[...]
 *   transmissions=[...]
 *   drivetrains=[...]
 */

export const getProductSidebarFilters = async (req, res) => {
    try {
        // Parse query params or request body for search and existing filters
        // (you could also pull from req.body if you prefer POST)
        const {
            search,
            categories,
            makes,
            models,
            manufacturers,
            fuelTypes,
            bodyTypes,
            transmissions,
            drivetrains,
        } = req.query;

        // Build a base match stage: if search text is provided, match against text index
        const matchStage = {};
        if (search) {
            matchStage.$text = { $search: search };
        }

        // Apply existing filter criteria to matchStage
        // Each of these should be an array of ObjectId strings or enum strings
        if (categories) {
            // e.g. categories=catId1,catId2
            matchStage.category = {
                $in: categories
                    .split(",")
                    .map((id) => id.trim())
                    .filter(mongoose.Types.ObjectId.isValid)
                    .map((id) => new mongoose.Types.ObjectId(id)),
            };
        }
        if (makes) {
            matchStage.makeId = {
                $in: makes
                    .split(",")
                    .map((id) => id.trim())
                    .filter(mongoose.Types.ObjectId.isValid)
                    .map((id) => new mongoose.Types.ObjectId(id)),
            };
        }
        if (models) {
            matchStage.modelId = {
                $in: models
                    .split(",")
                    .map((id) => id.trim())
                    .filter(mongoose.Types.ObjectId.isValid)
                    .map((id) => new mongoose.Types.ObjectId(id)),
            };
        }
        if (manufacturers) {
            matchStage.manufacturer = {
                $in: manufacturers
                    .split(",")
                    .map((id) => id.trim())
                    .filter(mongoose.Types.ObjectId.isValid)
                    .map((id) => new mongoose.Types.ObjectId(id)),
            };
        }
        if (fuelTypes) {
            matchStage.fuelType = { $in: fuelTypes.split(",") };
        }
        if (bodyTypes) {
            matchStage.bodyType = { $in: bodyTypes.split(",") };
        }
        if (transmissions) {
            matchStage.transmission = { $in: transmissions.split(",") };
        }
        if (drivetrains) {
            matchStage.drivetrain = { $in: drivetrains.split(",") };
        }

        // We’ll build separate aggregation pipelines for each facet we want counts for,
        // always starting with the same $match so counts reflect the current search/filters.

        // 1. Categories facet: group by category ObjectId, then lookup name/count
        const categoriesFacet = Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryDoc",
                },
            },
            {
                $unwind: {
                    path: "$categoryDoc",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    categoryId: "$_id",
                    name: "$categoryDoc.name",
                    slug: "$categoryDoc.slug",
                    count: 1,
                },
            },
        ]);

        // 2. Makes facet: group by makeId, lookup make name
        const makesFacet = Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$makeId",
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "makes",
                    localField: "_id",
                    foreignField: "_id",
                    as: "makeDoc",
                },
            },
            { $unwind: { path: "$makeDoc", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    makeId: "$_id",
                    name: "$makeDoc.name",
                    slug: "$makeDoc.slug",
                    count: 1,
                },
            },
        ]);

        // 3. Models facet: group by modelId, lookup car model name
        const modelsFacet = Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$modelId",
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "carmodels",
                    localField: "_id",
                    foreignField: "_id",
                    as: "modelDoc",
                },
            },
            {
                $unwind: {
                    path: "$modelDoc",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    modelId: "$_id",
                    name: "$modelDoc.name",
                    slug: "$modelDoc.slug",
                    count: 1,
                },
            },
        ]);

        // 4. Manufacturers facet: group by manufacturer, lookup manufacturer name
        const manufacturersFacet = Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$manufacturer",
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "manufacturers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "manufacturerDoc",
                },
            },
            {
                $unwind: {
                    path: "$manufacturerDoc",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    manufacturerId: "$_id",
                    name: "$manufacturerDoc.name",
                    slug: "$manufacturerDoc.slug",
                    count: 1,
                },
            },
        ]);

        // 5. FuelTypes facet: group by fuelType string
        const fuelTypesFacet = Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$fuelType",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    fuelType: "$_id",
                    count: 1,
                },
            },
        ]);

        // 6. BodyTypes facet: group by bodyType
        const bodyTypesFacet = Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$bodyType",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    bodyType: "$_id",
                    count: 1,
                },
            },
        ]);

        // 7. Transmissions facet: group by transmission
        const transmissionsFacet = Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$transmission",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    transmission: "$_id",
                    count: 1,
                },
            },
        ]);

        // 8. Drivetrains facet: group by drivetrain
        const drivetrainsFacet = Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$drivetrain",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    drivetrain: "$_id",
                    count: 1,
                },
            },
        ]);

        // 9. Price range: find min and max price among matched products
        const priceRangeFacet = Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" },
                },
            },
            {
                $project: {
                    _id: 0,
                    minPrice: 1,
                    maxPrice: 1,
                },
            },
        ]);

        // Run all aggregation pipelines in parallel
        const [
            categoriesData,
            makesData,
            modelsData,
            manufacturersData,
            fuelTypesData,
            bodyTypesData,
            transmissionsData,
            drivetrainsData,
            priceRangeData,
        ] = await Promise.all([
            categoriesFacet,
            makesFacet,
            modelsFacet,
            manufacturersFacet,
            fuelTypesFacet,
            bodyTypesFacet,
            transmissionsFacet,
            drivetrainsFacet,
            priceRangeFacet,
        ]);

        // Format final response
        return res.json({
            facets: {
                categories: categoriesData,
                makes: makesData,
                models: modelsData,
                manufacturers: manufacturersData,
                fuelTypes: fuelTypesData,
                bodyTypes: bodyTypesData,
                transmissions: transmissionsData,
                drivetrains: drivetrainsData,
                priceRange: priceRangeData[0] || { minPrice: 0, maxPrice: 0 },
            },
        });
    } catch (err) {
        return next(err);
    }
};
/**
 * GET /api/products/search
 *
 * Query params:
 *   q             - optional text to search for (via Atlas Search)
 *   oem           - optional comma-separated list of OEM numbers to match exactly
 *   tags          - optional comma-separated list of tags to match exactly
 *   minPrice      - optional: minimum price (number)
 *   maxPrice      - optional: maximum price (number)
 *   category      - optional: comma-separated category IDs
 *   make          - optional: comma-separated make IDs
 *   model         - optional: comma-separated model IDs
 *   manufacturer  - optional: comma-separated manufacturer IDs
 *   page          - optional: page number (default: 1)
 *   limit         - optional: results per page (default: 20)
 *
 * Behavior:
 *   • If `q` is provided and non-empty, use $search (Atlas Search dynamic index).
 *   • Otherwise, skip $search and use plain $match filters (including oem/tags).
 *   • Always apply price‐range and ObjectId filters in a $match stage.
 *   • Paginate + lookup + facet for results & totalCount.
 */

// export const searchProductsWithAtlas = async (req, res) => {
//     try {
//         const {
//             q,
//             oem,
//             tags,
//             minPrice,
//             maxPrice,
//             category,
//             make,
//             model,
//             manufacturer,
//             page = 1,
//             limit = 20,
//             year,
//         } = req.query;

//         // Build the “exact‐match” filters that apply whether or not we do $search
//         const matchFilters = { status: "active" };

//         // 1) Price‐range filter
//         if (minPrice || maxPrice) {
//             matchFilters.price = {};
//             if (minPrice) matchFilters.price.$gte = parseFloat(minPrice);
//             if (maxPrice) matchFilters.price.$lte = parseFloat(maxPrice);
//         }

//         // 2) OEM filter (array of exact OEM strings)
//         if (oem) {
//             // e.g. oem=OEM1234,OEM5678
//             const oemList = oem.split(",").map((item) => item.trim());
//             matchFilters.oemNumbers = { $in: oemList };
//         }

//         // 3) Tags filter (array of exact tag strings)
//         if (tags) {
//             // e.g. tags=performance,ceramic
//             const tagList = tags.split(",").map((item) => item.trim());
//             matchFilters.tags = { $in: tagList };
//         }

//         // 4) Year filter - check if the provided year falls within yearFrom and yearTo range
//         if (year) {
//             const yearNum = parseInt(year, 10);
//             if (!isNaN(yearNum)) {
//                 matchFilters.$and = [
//                     { yearFrom: { $lte: yearNum } }, // yearFrom <= year
//                     { yearTo: { $gte: yearNum } }, // yearTo >= year
//                 ];
//             }
//         }

//         // 5) Category / Make / Model / Manufacturer filters
//         if (category) {
//             const catIds = category
//                 .split(",")
//                 .map((id) => new mongoose.Types.ObjectId(id.trim()));
//             matchFilters.category = { $in: catIds }; // Array of category IDs
//         }
//         if (make) {
//             const makeIds = make
//                 .split(",")
//                 .map((id) => new mongoose.Types.ObjectId(id.trim()));
//             matchFilters.makeId = { $in: makeIds }; // Array of make IDs
//         }
//         if (model) {
//             const modelIds = model
//                 .split(",")
//                 .map((id) => new mongoose.Types.ObjectId(id.trim()));
//             matchFilters.modelId = { $in: modelIds }; // Array of model IDs
//         }
//         if (manufacturer) {
//             const manIds = manufacturer
//                 .split(",")
//                 .map((id) => new mongoose.Types.ObjectId(id.trim()));
//             matchFilters.manufacturer = { $in: manIds }; // Array of manufacturer IDs
//         }

//         // Now build the aggregation pipeline in two different ways:
//         //  A) If q is provided and non‐empty → start with $search
//         //  B) If q is missing/empty       → start with $match(matchFilters)

//         const pipeline = [];

//         if (q && q.trim() !== "") {
//             // ─── Case A: Use Atlas Search $search stage with boosted fields ────────────
//             pipeline.push({
//                 $search: {
//                     index: "default",
//                     compound: {
//                         should: [
//                             // Boost exact matches in oemNumbers and manufacturerPartNumbers
//                             {
//                                 text: {
//                                     query: q.trim(),
//                                     path: "oemNumbers",
//                                     score: { boost: { value: 5 } },
//                                 },
//                             },
//                             {
//                                 text: {
//                                     query: q.trim(),
//                                     path: "manufacturerPartNumbers",
//                                     score: { boost: { value: 5 } },
//                                 },
//                             },
//                             // Include the default search across all fields
//                             {
//                                 text: {
//                                     query: q.trim(),
//                                     path: { wildcard: "*" },
//                                     fuzzy: { maxEdits: 1 },
//                                 },
//                             },
//                         ],
//                         minimumShouldMatch: 1,
//                     },
//                 },
//             });

//             // Then apply the remaining filters (price, oem, tags, category, etc.)
//             pipeline.push({ $match: matchFilters });
//         } else {
//             // ─── Case B: No free‐text. Just $match on the filters we built.
//             pipeline.push({ $match: matchFilters });
//         }

//         // ─── Common Next Stages: Lookups + Prisma-like facet ────────────────────────────

//         // 1) Lookup category name (single category)
//         pipeline.push({
//             $lookup: {
//                 from: "categories",
//                 localField: "category",
//                 foreignField: "_id",
//                 as: "categoryDoc",
//             },
//         });
//         pipeline.push({
//             $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true },
//         });

//         // 2) Lookup make names (array of makes)
//         pipeline.push({
//             $lookup: {
//                 from: "makes",
//                 localField: "makeId",
//                 foreignField: "_id",
//                 as: "makeDocs",
//             },
//         });
//         pipeline.push({
//             $addFields: {
//                 make: {
//                     $map: { input: "$makeDocs", as: "make", in: "$$make.name" },
//                 },
//             },
//         });

//         // 3) Lookup manufacturer names (array of manufacturers)
//         pipeline.push({
//             $lookup: {
//                 from: "manufacturers",
//                 localField: "manufacturer",
//                 foreignField: "_id",
//                 as: "manufacturerDocs",
//             },
//         });
//         pipeline.push({
//             $addFields: {
//                 manufacturer: {
//                     $map: {
//                         input: "$manufacturerDocs",
//                         as: "man",
//                         in: "$$man.name",
//                     },
//                 },
//             },
//         });

//         // 4) Lookup model names (array of models)
//         pipeline.push({
//             $lookup: {
//                 from: "carmodels",
//                 localField: "modelId",
//                 foreignField: "_id",
//                 as: "modelDocs",
//             },
//         });
//         pipeline.push({
//             $addFields: {
//                 model: {
//                     $map: { input: "$modelDocs", as: "mod", in: "$$mod.name" },
//                 },
//             },
//         });

//         // 5) Add score to results for debugging and sorting
//         pipeline.push({
//             $addFields: {
//                 searchScore: { $meta: "searchScore" },
//             },
//         });

//         // 6) Facet for results + totalCount
//         pipeline.push({
//             $facet: {
//                 results: [
//                     { $sort: { searchScore: -1 } }, // Sort by search score
//                     { $skip: (Number(page) - 1) * Number(limit) },
//                     { $limit: Number(limit) },
//                     {
//                         $project: {
//                             _id: 1,
//                             name: 1,
//                             slug: 1,
//                             price: 1,
//                             mrp: 1,
//                             thumbnail: 1,
//                             stock: 1,
//                             // Return human-readable names from lookups:
//                             category: "$categoryDoc.name",
//                             make: "$makeDoc.name",
//                             manufacturer: "$manufacturerDoc.name",
//                             model: "$modelDoc.name",
//                             // Also return OEMs/tags if needed:
//                             tags: 1,
//                             oemNumbers: 1,
//                             manufacturerPartNumbers: 1,
//                             searchScore: 1, // Include search score in results for debugging
//                         },
//                     },
//                 ],
//                 totalCount: [{ $count: "count" }],
//             },
//         });

//         // ─── Execute the pipeline ───────────────────────────────────────────────────────
//         const [aggregationResult] = await Product.aggregate(pipeline);

//         // Extract total count (or 0 if nothing matched)
//         const total = aggregationResult.totalCount.length
//             ? aggregationResult.totalCount[0].count
//             : 0;

//         return res.json({
//             page: Number(page),
//             limit: Number(limit),
//             total,
//             results: aggregationResult.results,
//         });
//     } catch (err) {
//         console.error("searchProductsWithAtlas error:", err);
//         return res.json({
//             error: true,
//             message: "Something wents wrong, Please try after sometime",
//         });
//     }
// };


export const searchProductsWithAtlas = async (req, res) => {
    try {
      const {
        q = "",
        limit = 20,
        page = 1,
        categoryParam = req.query.categories || req.query.category,
                minPrice = 0,
        maxPrice = 50000,
        sortBy = "relevance",
      } = req.query;
  
      const filters = {
        status: "active",
        price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
      };
  
      if (q.trim()) filters.name = new RegExp(q.trim(), "i");
  
      if (categoryParam) {
        const categoryArray = categoryParam.split(",").filter(Boolean);
        filters.category = { $in: categoryArray };
      }
  
      let sort = { priority: -1, createdAt: -1 };
      if (sortBy === "price_low_to_high") sort = { price: 1 };
      if (sortBy === "price_high_to_low") sort = { price: -1 };
  
      const skip = (Number(page) - 1) * Number(limit);
  
      const [results, total] = await Promise.all([
        Product.find(filters)
          .limit(Number(limit))
          .skip(skip)
          .sort(sort)
          .select("name slug thumbnail price mrp tags"),
        Product.countDocuments(filters),
      ]);
  
      res.json({
        total,
        results,
        totalPages: Math.ceil(total / Number(limit)),
        page: Number(page),
      });
    } catch (err) {
      console.error("searchProductsWithAtlas error:", err);
      res.status(500).json({ error: true, message: "Server error" });
    }
  };
  
  
  
  
