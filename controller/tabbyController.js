import axios from "axios";
import crypto from "crypto";
import { sendOrderConfirmationEmails } from "../lib/emailService.js";
import Order from "../model/Order.js";


// Check Tabby payment eligibility
export const checkEligibility = async (req, res) => {
    try {
        const { amount, currency = "AED", phone } = req.body;

        const payload = {
            payment: {
                amount: amount.toString(),
                currency,
                buyer: phone ? { phone } : {},
            },
            lang: "en",
            merchant_code: process.env.TABBY_MERCHANT_CODE,
        };

        const response = await axios.post(
            `${process.env.TABBY_API_URL}/checkout`,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.TABBY_PUBLIC_KEY}`,
                },
            },
        );

        const available =
            response.data.configuration?.available_products?.installments || [];

        return res.json({
            eligible: available.length > 0,
            products: response.data.configuration?.available_products || null,
            installments: available.length > 0 ? available[0] : null,
        });
    } catch (error) {
        console.error(
            "Tabby eligibility error:",
            error.response?.data || error.message,
        );
        return res.status(500).json({
            eligible: false,
            error: "Failed to check eligibility",
        });
    }
};

// Create Tabby checkout session
export const createTabbySession = async (req, res) => {
    try {
        const orderData = req.body;

        // First create the order with pending status
        const newOrderData = {
            ...orderData,
            paymentMethod: "tabby",
            paymentStatus: "pending",
            status: "pending",
        };

        // Create order using existing logic (you can reuse your createOrder logic)
        const orderResponse = await createOrderInternal(newOrderData);

        if (!orderResponse.success) {
            return res.status(400).json({
                success: false,
                error: "Failed to create order",
            });
        }

        const order = orderResponse.order;

        // Create Tabby checkout session
        const tabbyPayload = {
            payment: {
                amount: orderData.total.toFixed(2),
                currency: orderData.currency || "AED",
                description: `Order ${order.orderId}`,
                buyer: {
                    phone: orderData.phone,
                    email: orderData.email,
                    name: `${orderData.firstName} ${orderData.lastName}`,
                    dob: null,
                },
                buyer_history: {
                    registered_since: new Date().toISOString(),
                    loyalty_level: 0,
                },
                order: {
                    tax_amount: orderData.tax.toFixed(2),
                    shipping_amount: orderData.shippingCharge.toFixed(2),
                    discount_amount: (orderData.couponDiscount || 0).toFixed(2),
                    updated_at: new Date().toISOString(),
                    reference_id: order.orderId,
                    items: orderData.products.map((product) => ({
                        title: product.name,
                        description: product.name,
                        quantity: product.quantity,
                        unit_price: product.price.toFixed(2),
                        discount_amount: (
                            (product.originalPrice || product.price) -
                            product.price
                        ).toFixed(2),
                        reference_id: product._id.toString(),
                        image_url: product.thumbnail || null,
                        product_url: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product._id}`,
                        category: product.category || "General",
                    })),
                },
                order_history: [],
                shipping_address: {
                    city: orderData.city,
                    address: orderData.address,
                    zip: orderData.postalCode || "00000",
                },
                meta: {
                    order_id: order.orderId,
                    customer: orderData.email,
                },
            },
            lang: "en",
            merchant_code: process.env.TABBY_MERCHANT_CODE,
            merchant_urls: {
                success: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/tabby/success?order_id=${order.orderId}`,
                cancel: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/tabby/cancel?order_id=${order.orderId}`,
                failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/tabby/failure?order_id=${order.orderId}`,
            },
        };

        const tabbyResponse = await axios.post(
            `${process.env.TABBY_API_URL}/checkout`,
            tabbyPayload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.TABBY_SECRET_KEY}`,
                },
            },
        );

        // Update order with Tabby session ID
        await Order.findByIdAndUpdate(order._id, {
            tabbySessionId: tabbyResponse.data.id,
            "payments.0.transactionId": tabbyResponse.data.id,
            "payments.0.gateway": "tabby",
        });

        return res.json({
            success: true,
            orderId: order.orderId,
            checkoutId: tabbyResponse.data.id,
            redirectUrl:
                tabbyResponse.data.configuration.available_products
                    .installments[0].web_url,
        });
    } catch (error) {
        console.error(
            "Tabby session creation error:",
            error.response?.data || error.message,
        );
        return res.status(500).json({
            success: false,
            error: "Failed to create Tabby payment session",
        });
    }
};

// Tabby webhook handler
export const handleWebhook = async (req, res) => {
    try {
        // Verify webhook signature
        const signature = req.headers["x-tabby-signature"];
        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac("sha256", process.env.TABBY_WEBHOOK_SECRET)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("Invalid Tabby webhook signature");
            return res.status(401).json({ error: "Invalid signature" });
        }

        const { id: paymentId, status } = req.body;

        // Find order by Tabby session ID
        const order = await Order.findOne({ tabbySessionId: paymentId });

        if (!order) {
            console.error("Order not found for Tabby payment:", paymentId);
            return res.status(404).json({ error: "Order not found" });
        }

        console.log(
            `Tabby webhook received for order ${order.orderId}: ${status}`,
        );

        // Update order based on payment status
        let updateData = {};

        switch (status) {
            case "AUTHORIZED":
                updateData = {
                    paymentStatus: "authorized",
                    "payments.0.status": "authorized",
                    status: "confirmed",
                };
                break;

            case "CLOSED":
                updateData = {
                    paymentStatus: "paid",
                    "payments.0.status": "completed",
                    status: "confirmed",
                };

                // Send order confirmation email
                try {
                    await sendOrderConfirmationEmails(order._id);
                } catch (emailError) {
                    console.error("Email sending error:", emailError);
                }
                break;

            case "REJECTED":
            case "EXPIRED":
                updateData = {
                    paymentStatus: "failed",
                    "payments.0.status": "failed",
                    status: "cancelled",
                };
                break;
        }

        if (Object.keys(updateData).length > 0) {
            await Order.findByIdAndUpdate(order._id, updateData);
            console.log(
                `Order ${order.orderId} updated with status: ${status}`,
            );
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error("Tabby webhook error:", error);
        return res.status(500).json({ error: "Webhook processing failed" });
    }
};

// Verify Tabby payment status
export const verifyPayment = async (req, res) => {
    try {
        const { paymentId, orderId } = req.body;

        // Get payment details from Tabby
        const response = await axios.get(
            `${process.env.TABBY_API_URL}/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.TABBY_SECRET_KEY}`,
                },
            },
        );

        const paymentData = response.data;

        // Find order
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: "Order not found",
            });
        }

        // Check if payment is successful
        const isSuccessful = ["AUTHORIZED", "CLOSED"].includes(
            paymentData.status,
        );

        if (isSuccessful && order.paymentStatus === "pending") {
            // Update order status
            await Order.findByIdAndUpdate(order._id, {
                paymentStatus:
                    paymentData.status === "CLOSED" ? "paid" : "authorized",
                "payments.0.status":
                    paymentData.status === "CLOSED"
                        ? "completed"
                        : "authorized",
                status: "confirmed",
            });
        }

        return res.json({
            success: isSuccessful,
            paymentStatus: paymentData.status,
            order: order,
        });
    } catch (error) {
        console.error("Tabby payment verification error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to verify payment",
        });
    }
};

// Helper function to create order (reuse your existing logic)
async function createOrderInternal(orderData) {
    try {
        // Use your existing order creation logic from orderController.js
        // This is simplified - you should use your actual createOrder logic

        const newOrder = new Order({
            ...orderData,
            orderId: await generateOrderId(), // Your existing function
            payments: [
                {
                    method: "tabby",
                    status: "pending",
                    amount: orderData.total,
                    currency: orderData.currency || "AED",
                    createdAt: new Date(),
                },
            ],
        });

        const savedOrder = await newOrder.save();

        return {
            success: true,
            order: savedOrder,
        };
    } catch (error) {
        console.error("Order creation error:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}
