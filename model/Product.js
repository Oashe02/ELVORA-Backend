
import mongoose from "mongoose";
const { Schema } = mongoose;

const ProductSchema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, unique: true, sparse: true },
        sku: { type: String, unique: true, sparse: true },
        barcode: { type: String },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
            required: true,
        },

        redeemPoints: { type: Number, default: 0 },

        mrp: { type: Number, required: true },
        price: { type: Number, required: true },
        costPrice: { type: Number },

        stock: { type: Number, default: 0 },
        lowStockThreshold: { type: Number, default: 5 },

        shortDescription: { type: String },
        description: { type: String },

        thumbnail: { type: String, required: true },
        images: [{ type: String }],
        videos: [{ type: String }],
        googleProductCategory: { type: String },
        priority: { type: Number, default: 0 },

        flowerType: {
            type: String,
            enum: [
                "roses",
                "tulips",
                "lilies",
                "orchids",
                "peonies",
                "carnations",
                "daisies",
                "mix",
                "others",
            ],
        },

        occasion: [{ type: String }], // e.g. ["birthday", "anniversary", "wedding"]
        color: [{ type: String }],
        fragranceLevel: { type: String, enum: ["low", "medium", "strong"] },

        variants: [
            {
                size: {
                    type: String,
                    enum: ["small", "medium", "large", "extra-large"],
                    required: true,
                },
                price: { type: Number, required: true },
                mrp: { type: Number },
                costPrice: { type: Number },
                stock: { type: Number, default: 0 },
            },
        ],

        giftSetOptions: [{ type: String }],
        deliveryInformation: { type: String },
        careInstructions: { type: String },

        status: {
            type: String,
            enum: ["active", "draft", "unpublished", "discontinued"],
            default: "draft",
        },
        featured: { type: Boolean, default: false },
        tags: [{ type: String }],
        isArtificial: { type: Boolean, default: false },

        seo: {
            title: { type: String },
            description: { type: String },
            keywords: [{ type: String }],
        },

        allowBackorders: { type: Boolean, default: false },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true },
);

const Product = mongoose.model("products", ProductSchema);
export default Product;
