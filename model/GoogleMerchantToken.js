import mongoose from "mongoose";
const GoogleMerchantTokenSchema = new mongoose.Schema(
    {
        access_token: String,
        refresh_token: String,
        expires_at: Number,
        token_type: String,
        scope: String,
    },
    {
        timestamps: true,
    },
);

const GoogleMerchantToken = mongoose.model(
    "GoogleMerchantToken",
    GoogleMerchantTokenSchema,
);

export default GoogleMerchantToken;
