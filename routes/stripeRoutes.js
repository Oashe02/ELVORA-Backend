import express from "express";
const router = express.Router();
import Order from "../model/Order.js";
import { sendOrderConfirmationEmails } from "../lib/emailService.js";
import { fullfillCheckout } from "../utils/utils.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


router.post("/", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET,
        );
    } catch (err) {
        console.error(
            "Stripe webhook signature verification failed:",
            err.message,
        );
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        console.log({ event: JSON.stringify(event) });
        try {
            switch (event.type) {
                case "payment_intent.succeeded": {
                    const intent = event.data.object;
                    const orderId = intent.metadata?.orderId;

                    if (!orderId) {
                        console.error("No orderId in payment intent metadata");
                        return res
                            .status(400)
                            .send("Missing orderId in metadata");
                    }
                    {
                        const order = await Order.findOne({ orderId })
                            .populate(
                                "products.product",
                                "_id name thumbnail price mrp sku stock",
                            )
                            .populate("user", "email")
                            .populate(
                                "profile",
                                "firstName lastName phone  address emirate city state postalCode country",
                            );
                        if (order) {
                            await fullfillCheckout(order);
                        } else {
                            console.error(
                                `Order ${orderId} not found during webhook fulfilment`,
                            );
                        }
                    }

                    console.log(
                        `✅ Payment succeeded for order ${orderId}, amount: ${intent.currency.toUpperCase()} ${(intent.amount / 100).toFixed(2)}`,
                    );
                    break;
                }

                case "payment_intent.payment_failed": {
                    const intent = event.data.object;
                    const orderId = intent.metadata?.orderId;

                    if (!orderId) {
                        console.error("No orderId in payment intent metadata");
                        return res
                            .status(400)
                            .send("Missing orderId in metadata");
                    }

                    const order = await Order.findOne({ orderId })
                        .populate(
                            "products.product",
                            "_id name thumbnail price mrp sku stock",
                        )
                        .populate("user", "email")
                        .populate(
                            "profile",
                            "firstName lastName phone  address emirate city state postalCode country",
                        );
                    if (!order) {
                        console.error(
                            `Order not found for orderId: ${orderId}`,
                        );
                        return res.status(404).send("Order not found");
                    }

                    // Update order status
                    order.paymentStatus = "failed";
                    order.status = "cancelled";

                    // Update payment record
                    const paymentIndex = order.payments.findIndex(
                        (p) => p.transactionId === intent.id,
                    );

                    const failureReason =
                        intent.last_payment_error?.message ||
                        "Payment declined";

                    if (paymentIndex !== -1) {
                        order.payments[paymentIndex].status = "failed";
                        order.payments[paymentIndex].failureReason =
                            failureReason;
                        order.payments[paymentIndex].failedAt = new Date();
                    } else {
                        order.payments.push({
                            method: "stripe",
                            transactionId: intent.id,
                            gateway: "stripe",
                            status: "failed",
                            amount: intent.amount / 100,
                            currency: intent.currency,
                            failureReason,
                            failedAt: new Date(),
                        });
                    }

                    // Add history entry
                    order.history.push({
                        status: "cancelled",
                        paymentStatus: "failed",
                        note: `Payment failed: ${failureReason}`,
                        timestamp: new Date(),
                        metadata: {
                            stripeEventId: event.id,
                            paymentIntentId: intent.id,
                            errorCode: intent.last_payment_error?.code,
                        },
                    });

                    await order.save();

                    console.log(
                        `❌ Payment failed for order ${orderId}: ${failureReason}`,
                    );
                    break;
                }

                case "payment_intent.requires_action": {
                    const intent = event.data.object;
                    const orderId = intent.metadata?.orderId;

                    console.log(
                        `⚠️ Payment requires action for order ${orderId}`,
                    );

                    if (orderId) {
                        const order = await Order.findOne({ orderId })
                            .populate(
                                "products.product",
                                "_id name thumbnail price mrp sku stock",
                            )
                            .populate("user", "email")
                            .populate(
                                "profile",
                                "firstName lastName phone  address emirate city state postalCode country",
                            );
                        if (order) {
                            order.history.push({
                                status: order.status,
                                paymentStatus: "requires_action",
                                note: "Payment requires additional authentication (3D Secure)",
                                timestamp: new Date(),
                                metadata: {
                                    stripeEventId: event.id,
                                    paymentIntentId: intent.id,
                                },
                            });
                            await order.save();
                        }
                    }
                    break;
                }

                case "payment_intent.canceled": {
                    const intent = event.data.object;
                    const orderId = intent.metadata?.orderId;

                    if (orderId) {
                        const order = await Order.findOne({ orderId })
                            .populate(
                                "products.product",
                                "_id name thumbnail price mrp sku stock",
                            )
                            .populate("user", "email")
                            .populate(
                                "profile",
                                "firstName lastName phone  address emirate city state postalCode country",
                            );
                        if (order && order.paymentStatus !== "paid") {
                            order.paymentStatus = "cancelled";
                            order.status = "cancelled";

                            order.history.push({
                                status: "cancelled",
                                paymentStatus: "cancelled",
                                note: "Payment was cancelled",
                                timestamp: new Date(),
                                metadata: {
                                    stripeEventId: event.id,
                                    paymentIntentId: intent.id,
                                },
                            });

                            await order.save();
                            console.log(
                                `🚫 Payment cancelled for order ${orderId}`,
                            );
                        }
                    }
                    break;
                }

                default:
                    console.log(`Unhandled Stripe event type: ${event.type}`);
            }

            res.status(200).json({ received: true });
        } catch (handlerErr) {
            // Log the error details but still acknowledge the event to Stripe
            console.error("Stripe webhook processing error:", handlerErr);
            res.status(200).json({ received: true, error: handlerErr.message });
        }
    } catch (err) {
        console.error("Stripe webhook outer error:", err);
        res.status(200).json({ received: true, error: err.message });
    }
});

export default router;

