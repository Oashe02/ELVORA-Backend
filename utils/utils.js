import { sendOrderConfirmationEmails, sendAdminStockAlertEmail } from "../lib/emailService.js";
import { generateAdminStockAlertEmail } from "../lib/emailTemplates.js";
import Order from "../model/Order.js";
import Product from "../model/Product.js";
import Profile from "../model/Profile.js";
import Settings from "../model/Settings.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Utility: Slug Generator
export function generateSlug(title) {
    let slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .substring(0, 100);

    return slug.replace(/-$/, "");
}

// Fulfill Checkout Logic
export const fullfillCheckout = async (order) => {
    try {
        if (order.paymentMethod === "cod" && order.status === "processing") {
            console.log(`Order ${order.orderId} already marked as paid – ignoring.`);
            return order;
        }

        if (order.paymentMethod === "stripe") {
            const intent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
            const charge = intent.latest_charge
                ? await stripe.charges.retrieve(intent.latest_charge)
                : null;

            const isPaymentCaptured =
                intent.status === "succeeded" &&
                intent.amount_received === intent.amount &&
                (!charge || (charge.paid && charge.captured));

            if (!isPaymentCaptured) {
                console.warn(`PaymentIntent for order ${order.orderId} is not succeeded (status = ${intent.status}). Skipping fulfilment.`);
                return order;
            }

            order.paymentStatus = "paid";
            order.status = "processing";

            const paymentIndex = order.payments.findIndex(p => p.transactionId === intent.id);
            const paymentRecord = {
                method: "stripe",
                transactionId: intent.id,
                gateway: "stripe",
                status: "succeeded",
                amount: intent.amount / 100,
                currency: intent.currency,
                paidAt: new Date(),
                stripePaymentIntentId: intent.id,
            };

            if (paymentIndex !== -1) {
                order.payments[paymentIndex] = { ...order.payments[paymentIndex], ...paymentRecord };
            } else {
                order.payments.push(paymentRecord);
            }

            order.history.push({
                status: order.status,
                paymentStatus: order.paymentStatus,
                note: `Payment succeeded via Stripe. Amount: ${intent.currency.toUpperCase()} ${(intent.amount / 100).toFixed(2)}`,
                timestamp: new Date(),
                metadata: {
                    stripeEventId: order.stripeEventId,
                    paymentIntentId: intent.id,
                },
            });

        } else if (order.paymentMethod === "cod") {
            order.paymentStatus = "pending";
            order.status = "processing";
            order.history.push({
                status: order.status,
                paymentStatus: order.paymentStatus,
                note: "Order placed with Cash on Delivery (payment due on receipt).",
                timestamp: new Date(),
            });
        }

        await order.save();

        try {
            await sendOrderConfirmationEmails(order._id);
            console.log(`✅ Confirmation e-mails sent for order ${order.orderId}`);

            const settings = await Settings.findOne({}).lean();

            for (const item of order.products) {
                const { product, quantity } = item;

                const productUpdated = await Product.findByIdAndUpdate(
                    product._id,
                    { stock: product.stock - quantity },
                    { new: true },
                );

                if (productUpdated.stock <= settings.general.lowStockThreshold) {
                    const profile = await Profile.findOne({ user: order.user });
                    await sendAdminStockAlertEmail({
                        order,
                        profile,
                        adminEmail: process.env.ADMIN_EMAIL || "ashadnasim123@gmail.com",
                    });
                    console.log(`Product ${productUpdated.name} is low on stock ${productUpdated.stock}`);
                }
            }

        } catch (emailErr) {
            console.error("Failed to send confirmation e-mails:", emailErr);
            order.history.push({
                status: order.status,
                paymentStatus: order.paymentStatus,
                note: `Warning: Failed to send confirmation e-mails. Error: ${emailErr.message}`,
                timestamp: new Date(),
            });
            await order.save();
        }

        return order;
    } catch (err) {
        console.error("Error in fullfillCheckout:", err);
        return null;
    }
};

// Role Constants
export const UserRoles = {
    ADMIN: "admin",
    SALESPERSON: "salesperson",
    AGENT: "agent",
    SUPPORT: "support",
    USER: "user",
};

export const EnquiryStatus = {
    PENDING: "pending",
    ASSIGNED: "assigned",
    RESOLVED: "resolved",
    HOLD: "hold",
};

export const isPROD = process.env.NODE_ENV === "production";
