import mongoose from "mongoose";

const GoogleMerchantSyncHistorySchema = new mongoose.Schema(
    {
        syncDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["success", "partial", "failed"],
            required: true,
        },
        source: {
            type: String,
            enum: ["auto", "manual"],
            default: "manual",
        },
        totalProducts: {
            type: Number,
            default: 0,
        },
        successCount: {
            type: Number,
            default: 0,
        },
        errorCount: {
            type: Number,
            default: 0,
        },
        failureCount: {
            type: Number,
            default: 0,
        },
        deletedCount: {
            type: Number,
            default: 0,
        },
        errors: [
            {
                productId: String,
                productTitle: String,
                error: String,
                message: String,
            },
        ],
        duration: Number,
        feedUrl: String,
    },
    {
        timestamps: true,
    },
);

const GoogleMerchantSyncHistory = mongoose.model(
    "GoogleMerchantSyncHistory",
    GoogleMerchantSyncHistorySchema,
);

export default GoogleMerchantSyncHistory;
