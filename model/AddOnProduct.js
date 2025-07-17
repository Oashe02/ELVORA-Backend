
import mongoose from "mongoose";
const { Schema } = mongoose;

const AddOnProductSchema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, unique: true, sparse: true },
        sku: { type: String, unique: true, sparse: true },
        barcode: { type: String },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "addons",
            required: true,
        },


        mrp: { type: Number, required: true },
        price: { type: Number, required: true },
        costPrice: { type: Number },
        // featured: { type: Boolean, default: false },

        stock: { type: Number, default: 0 },
        lowStockThreshold: { type: Number, default: 5 },

        shortDescription: { type: String },
        description: { type: String },

        thumbnail: { type: String, required: true },
        images: [{ type: String }],
        videos: [{ type: String }],
        googleProductCategory: { type: String },
        priority: { type: Number, default: 0 },

    


        // variants: [
        //     {
        //         size: {
        //             type: String,
        //             enum: ["small", "medium", "large", "extra-large"],
        //             required: true,
        //         },
        //         price: { type: Number, required: true },
        //         mrp: { type: Number },
        //         costPrice: { type: Number },
        //         stock: { type: Number, default: 0 },
        //     },
        // ],


        status: {
            type: String,
            enum: ["active", "draft", "unpublished", "discontinued"],
            default: "draft",
        },
        // featured: { type: Boolean, default: false },
        // tags: [{ type: String }],
        // isArtificial: { type: Boolean, default: false },

        seo: {
            title: { type: String },
            description: { type: String },
            keywords: [{ type: String }],
        },

        allowBackorders: { type: Boolean, default: false },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true ,
    collection: "addonproducts",
},
);

console.log("💥 Active Mongoose models:", mongoose.modelNames());


const AddOnProduct = mongoose.models.AddOnProduct || mongoose.model("AddOnProduct", AddOnProductSchema);
export default AddOnProduct;
