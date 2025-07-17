import mongoose from "mongoose";
const { Schema } = mongoose;
const OrderSchema = new Schema(
    {
        orderId: {
            type: String,
            required: false,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
        },
        profile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "profiles",
        },
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "products",
                },
                name: { type: String, required: true },
                sku: { type: String },
                variant: {
                    name: { type: String },
                    attributes: { type: Map, of: String },
                },
                price: { type: Number, required: true },
                originalPrice: { type: Number },
                quantity: { type: Number, required: true },
                subtotal: { type: Number, required: true },
                tax: { type: Number },
                taxRate: { type: Number },
                taxClass: { type: String },
                discounts: [
                    {
                        type: { type: String, enum: ["percentage", "fixed"] },
                        value: { type: Number },
                        reason: { type: String },
                    },
                ],
                digital: { type: Boolean, default: false },
                downloadUrl: { type: String },
                downloadExpiry: { type: Date },
                fulfillmentStatus: {
                    type: String,
                    enum: [
                        "pending",
                        "fulfilled",
                        "partially_fulfilled",
                        "backordered",
                        "cancelled",
                    ],
                    default: "pending",
                },
                metadata: { type: Map, of: Schema.Types.Mixed },
            },
        ],
        couponCode: { type: String },
        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        taxRate: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        shippingCharge: { type: Number, default: 0 },
        total: { type: Number, required: true },
        status: {
            type: String,
            enum: [
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
                "returned",
                "partially_shipped",
                "on_hold",
                "refunded",
            ],
            default: "pending",
        },
        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded",
                "partially_refunded",
                "authorized",
                "voided",
            ],
            default: "pending",
        },
        paymentMethod: { type: String, default: "credit_card" },
        payments: [
            {
                method: { type: String, required: true },
                transactionId: { type: String },
                gateway: { type: String },
            },
        ],
        notes: { type: String },
        history: [
            {
                status: {
                    type: String,
                    enum: [
                        "pending",
                        "processing",
                        "shipped",
                        "delivered",
                        "cancelled",
                        "returned",
                        "partially_shipped",
                        "on_hold",
                        "refunded",
                    ],
                },
                paymentStatus: {
                    type: String,
                    enum: [
                        "pending",
                        "paid",
                        "failed",
                        "refunded",
                        "partially_refunded",
                        "authorized",
                        "voided",
                    ],
                },
                note: { type: String },
                timestamp: { type: Date, default: Date.now },
                updatedBy: { type: String },
            },
        ],
        trackingCode: { type: String },
        currency: { type: String, default: "USD" },
        currencyRate: { type: Number, default: 1 },
        fulfillmentType: {
            type: String,
            enum: ["shipping", "pickup", "digital"],
            default: "shipping",
        },
        carrier: { type: String },
        paymentIntentId: { type: String },
        trackingNumber: { type: String },
        estimatedDeliveryDate: { type: Date },
        actualDeliveryDate: { type: Date },
        returnDeadline: { type: Date },
        returns: [
            {
                returnId: { type: String, required: true },
                items: [
                    {
                        product: {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: "products",
                            required: true,
                        },
                        quantity: { type: Number, required: true },
                        reason: { type: String, required: true },
                    },
                ],
                status: {
                    type: String,
                    enum: [
                        "requested",
                        "approved",
                        "received",
                        "processed",
                        "rejected",
                    ],
                    default: "requested",
                },
                refundAmount: { type: Number },
                refundStatus: {
                    type: String,
                    enum: ["pending", "processed", "rejected"],
                },
                createdAt: { type: Date, default: Date.now },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
        tags: [{ type: String }],
    },
    { timestamps: true },
);

const Order = mongoose.model("orders", OrderSchema);

export default Order;
