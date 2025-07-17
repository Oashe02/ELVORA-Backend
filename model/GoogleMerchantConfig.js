import mongoose from "mongoose";

const GoogleMerchantConfigSchema = new mongoose.Schema(
    {
        merchantId: {
            type: String,
            default: "",
        },
        isConnected: {
            type: Boolean,
            default: false,
        },
        autoSync: {
            type: Boolean,
            default: false,
        },
        syncFrequency: {
            type: String,
            enum: ["daily", "weekly", "monthly"],
            default: "daily",
        },
        syncTime: {
            type: String,
            default: "00:00",
        },
        defaultCurrency: {
            type: String,
            default: "USD",
        },
        defaultCountry: {
            type: String,
            default: "US",
        },
        defaultLanguage: {
            type: String,
            default: "en",
        },
        domain: {
            type: String,
            default: "",
        },
        attributeMapping: {
            id: { type: String, default: "_id" },
            title: { type: String, default: "name" },
            description: { type: String, default: "description" },
            link: { type: String, default: "slug" },
            imageLink: { type: String, default: "thumbnail" },
            availability: { type: String, default: "stock" },
            price: { type: String, default: "price" },
            brand: { type: String, default: "brand" },
            gtin: { type: String, default: "barcode" },
            mpn: { type: String, default: "sku" },
            condition: { type: String, default: "new" },
        },
        defaultShipping: {
            service: { type: String, default: "Standard Shipping" },
            price: { type: Number, default: 0 },
            currency: { type: String, default: "USD" },
        },
        defaultTax: {
            rate: { type: Number, default: 0 },
            country: { type: String, default: "US" },
            region: { type: String, default: "" },
        },
        feedUrl: String,
        accessToken: String,
        refreshToken: String,
        tokenExpiry: Date,
        lastSyncDate: Date,
        lastSyncStats: {
            totalProducts: Number,
            successCount: Number,
            errorCount: Number,
            deletedCount: Number,
            syncDate: Date,
        },
    },
    {
        timestamps: true,
    },
);

const GoogleMerchantConfig = mongoose.model(
    "GoogleMerchantConfig",
    GoogleMerchantConfigSchema,
);

export default  GoogleMerchantConfig;
