import { sendEmail } from "./resendMail.mjs";
import {
    generateOrderConfirmationEmail,
    generateAdminNotificationEmail,
    generateStatusUpdateEmail,
    generateOrderDeletionEmail,
    generateAdminStockAlertEmail,
} from "./emailTemplates.js";
import Order from "../model/Order.js";
import Profile from "../model/Profile.js";
import User from "../model/User.js";

/**
 * Send order confirmation emails to customer and admin
 * @param {string} orderId - Order ID
 */
export const sendOrderConfirmationEmails = async (orderId) => {
    try {
        const order = await Order.findById(orderId)
            .populate("products.product", "name price")
            .populate("user", "email")
            .populate("profile", "firstName lastName phone");
        if (!order) {
            throw new Error(`Order not found with ID: ${orderId}`);
        }

        const profile = await Profile.findById(order.profile);
        if (!profile) {
            throw new Error(`Profile not found for order: ${orderId}`);
        }

        const user = await User.findById(order.user);
        if (!user) {
            throw new Error(`User not found for order: ${orderId}`);
        }

        // Send confirmation email to customer
        await sendEmail({
            to: user.email,
            subject: `Order Confirmation - ${order.orderId}`,
            html: generateOrderConfirmationEmail(order, profile),
        });

        // Send notification email to admin
        await sendEmail({
            to: process.env.ADMIN_EMAIL || "iamsajidalam007@gmail.com",
            subject: `New Order - ${order.orderId}`,
            html: generateAdminNotificationEmail(order, profile),
        });

        console.log(`Order confirmation emails sent for order: ${orderId}`);
        return { success: true };
    } catch (error) {
        console.error("Error sending order confirmation emails:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Send order status update email to customer
 * @param {string} orderId - Order ID
 * @param {string} previousStatus - Previous order status
 */
export const sendStatusUpdateEmail = async (orderId, previousStatus) => {
    try {
        const order = await Order.findById(orderId)
            .populate("products.product", "name price")
            .populate("user", "email")
            .populate("profile", "firstName lastName phone");
        if (!order) {
            throw new Error(`Order not found with ID: ${orderId}`);
        }

        const profile = await Profile.findById(order.profile);
        if (!profile) {
            throw new Error(`Profile not found for order: ${orderId}`);
        }

        const user = await User.findById(order.user);
        if (!user) {
            throw new Error(`User not found for order: ${orderId}`);
        }

        // Send status update email to customer
        await sendEmail({
            to: user.email,
            subject: `Order Status Update - ${order.status}`,
            html: generateStatusUpdateEmail(order, profile, previousStatus),
        });

        console.log(`Status update email sent for order: ${orderId}`);
        return { success: true };
    } catch (error) {
        console.error("Error sending status update email:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Send order deletion email to customer
 * @param {string} orderId - Order ID
 */
export const sendOrderDeletionEmail = async (orderId) => {
    try {
        const order = await Order.findById(orderId)
            .populate("products.product", "name price")
            .populate("user", "email")
            .populate("profile", "firstName lastName phone");
        if (!order) {
            throw new Error(`Order not found with ID: ${orderId}`);
        }

        const profile = await Profile.findById(order.profile);
        if (!profile) {
            throw new Error(`Profile not found for order: ${orderId}`);
        }

        const user = await User.findById(order.user);
        if (!user) {
            throw new Error(`User not found for order: ${orderId}`);
        }

        // Send deletion email to customer
        await sendEmail({
            to: user.email,
            subject: `Order Cancelled - ${order.orderId}`,
            html: generateOrderDeletionEmail(order, profile),
        });

        console.log(`Deletion email sent for order: ${orderId}`);
        return { success: true };
    } catch (error) {
        console.error("Error sending order deletion email:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Send admin stock alert email
 * @param {Object} options - Email options
 */
export const sendAdminStockAlertEmail = async ({
    order,
    profile,
    adminEmail,
}) => {
    try {
        console.log({
            order,
            profile,
            adminEmail,
        });
        // const mailOptions = {
        //     from: process.env.EMAIL_USER,
        //     to: adminEmail,
        //     subject: `Stock Alert: New Order #${order.orderId}`,
        //     html: generateAdminStockAlertEmail(order, profile),
        // };
        // await transporter.sendMail(mailOptions);

        await sendEmail({
            to: adminEmail,
            subject: `Stock Alert: New Order #${order.orderId}`,
            html: generateAdminStockAlertEmail(order, profile),
        });
    } catch (error) {
        console.error("Error sending admin stock alert email:", error);
        return { success: false, error: error.message };
    }
};
