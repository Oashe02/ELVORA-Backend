import mongoose from "mongoose";
import Order from "../model/Order.js";
import Product from "../model/Product.js";
import User from "../model/User.js";
import Profile from "../model/Profile.js";
import Settings from "../model/Settings.js";

import { generateOrderId } from "../utils/googleMerchant/order-utils.js";
import { calculateDiscount } from "../utils/func.js";
import { calculateOrderTotals } from "../utils/order-helper.js";
import { validateAndCalculateCoupon } from "../utils/couponFuncs.js";

// Stripe payment gateway SDK
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

import {
  sendOrderConfirmationEmails,
  sendStatusUpdateEmail,
  sendOrderDeletionEmail,
} from "../lib/emailService.js";

import { fullfillCheckout } from "../utils/utils.js";


export const listOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { status, paymentStatus, search } = req.query;
        const skip = (page - 1) * limit;
        const filter = {};

        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (search) {
            const re = new RegExp(search, "i");
            filter.$or = [
                { orderId: { $regex: re } },
                { "customer.name": { $regex: re } },
                { "customer.email": { $regex: re } },
            ];
        }

        const [orders, totalOrders] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("products.product", "name thumbnail price mrp sku")
                .populate("profile", "firstName lastName")
                .lean(),
            Order.countDocuments(filter),
        ]);

        return res.json({
            orders,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: page,
        });
    } catch (err) {
        console.error("listOrders error:", err);
        return res.status(500).json({ error: "Failed to fetch orders" });
    }
};

export const createOrder = async (req, res) => {
    try {
        const body = req.body;
        console.log(body);
        const { products: frontendProducts, couponCode } = req.body;

        // _______________
        const settings = await Settings.findOne({}).lean();
        if (!settings) {
            return res.status(500).json({ error: "Settings not found" });
        }

        // items validation
        if (!Array.isArray(frontendProducts) || !frontendProducts.length) {
            return res
                .status(400)
                .json({ error: "No products provided in the order" });
        }

        // fetch products
        const productIds = frontendProducts.map((i) => i._id || i.product);
        const products = await Product.find({
            _id: { $in: productIds },
        }).lean();
        if (products.length !== frontendProducts.length) {
            return res.status(400).json({ error: "Some products not found" });
        }
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        // build orderProducts & subtotal
        let orderSubtotal = 0;
        const orderProducts = products.map((i) => {
            const prod = productMap.get(i._id?.toString() || i.productId);
            const qty = i.quantity || 1;
            const price = prod.price || 0;
            const orig = prod.mrp || price;
            const sub = price * qty;
            orderSubtotal += sub;
            return {
                ...prod,
                product: prod._id,
                name: prod.name,
                sku: prod.sku,
                price,
                originalPrice: orig,
                quantity: qty,
                subtotal: sub,
                fulfillmentStatus: "pending",
            };
        });

        // user/profile handling
        // let user = await getUserFromRequest(req);
        let user = await User.findOne({ email: req.body.email });
        console.log({ user });

        if (!user) {
            // guest checkout
            if (!body.firstName || !body.email || !body.phone) {
                return res.status(400).json({
                    error: "Guest orders require name, email & phone",
                });
            }
            let existing = await User.findOne({ email: body.email });
            if (!existing) {
                existing = await User.create({
                    email: body.email,
                    role: "user",
                });
            }
            user = existing;
        }

        let profile = await Profile.findOne({ user: user._id });
        if (!profile) {
            profile = await Profile.create({
                user: user._id,
                firstName: body.firstName,
                lastName: body.lastName,
                phone: body.phone,
            });
        }
        console.log({ user, profile });

        console.log({
            methods: settings.shipping.shippingMethods,
            selectedMethod: body.shippingMethod,
        });

        const selectedShippingMethod = settings.shipping.shippingMethods.filter(
            (method) => method.name === body.shippingMethod,
        )[0];
        if (!selectedShippingMethod) {
            return res
                .status(400)
                .json({ error: "Invalid shipping method selected" });
        }

        // coupon
        let discountAmount = 0,
            shippingCost = 0;
        if (couponCode) {
            const hasPrev = !!(await User.exists({
                _id: user._id,
                lastOrderDate: { $exists: true },
            }));
            const couponRes = await validateAndCalculateCoupon({
                code: couponCode,
                userId: user._id,
                isFirstPurchase: hasPrev,
                shippingCost: selectedShippingMethod.cost,
                cartItems: orderProducts,
            });
            console.log({ couponRes });

            const {
                valid,
                discount,
                freeShipping,
                freeItems,
                newSubtotal,
                newShipping,
                newTotal,
                message,
            } = couponRes;
            console.log({
                valid,
                discount,
                freeShipping,
                freeItems,
                newSubtotal,
                newShipping,
                newTotal,
                message,
            });

            if (!valid) {
                return res
                    .status(400)
                    .json({ success: false, message: message });
            }

            if (discount <= 0) {
                return res.json({
                    success: false,
                    message: "Coupon provides no discount",
                    discount: discount,
                });
            }

            if (freeShipping) {
                shippingCost = 0;
            } else {
                shippingCost = newShipping;
            }
            discountAmount = discount;
        }

        // totals
        const taxRate = settings?.tax?.taxRate || 0;
        const taxAmt = (orderSubtotal - discountAmount) * (taxRate / 100);
        const total = orderSubtotal - discountAmount + taxAmt + shippingCost;

        // ---------

        // orderId & history
        const lastOrderId = (
            await Order.findOne()
                .sort({ createdAt: -1 })
                .select("orderId")
                .lean()
        )?.orderId;
        const orderId = await generateOrderId(lastOrderId);
        const history = [
            {
                status: body.status || "pending",
                paymentStatus: body.paymentStatus || "pending",
                note: "Order created",
                timestamp: new Date(),
            },
        ];
        if (couponCode) {
            history.push({
                status: history[0].status,
                note: `Applied coupon ${body.couponCode}`,
                timestamp: new Date(),
            });
        }
        if (profile) {
            profile = await Profile.findOneAndUpdate(
                { user: user._id },
                {
                    firstName: body.firstName,
                    lastName: body.lastName,
                    apartment: body.apartment,
                    address: body.address,
                    country: body.country,
                    emirate: body.emirate,
                    phone: body.phone,
                    isGuest: true,
                },
                { upsert: true, new: true },
            );
        } else {
            profile = await new Profile({
                user: user._id,
                firstName: body.firstName,
                lastName: body.lastName,
                apartment: body.apartment,
                address: body.address,
                country: body.country,
                emirate: body.emirate,
                phone: body.phone,
                isGuest: true,
            }).save();
        }

        let payments = [];
        const orderData = {
            orderId,
            user: user._id,
            profile: profile._id,
            products: orderProducts,
            history,
            payments,
            couponCode: body.couponCode,
            discount: discountAmount,
            subtotal: orderSubtotal,
            taxRate,
            tax: taxAmt,
            shippingCharge: shippingCost,
            total,
            paymentMethod: body.paymentMethod || "cod",
            paymentStatus:
                body.paymentMethod === "stripe"
                    ? "pending"
                    : body.paymentStatus || "pending",
            status: body.status || "pending",
            shipping: body.address
                ? {
                      firstName: body.firstName,
                      lastName: body.lastName,
                      address: body.address,
                      address2: body.apartment,
                      city: body.city,
                      state: body.emirate,
                      postalCode: body.postalCode || "",
                      country: body.country,
                      phone: body.phone,
                      method: body.shippingMethod || "standard",
                  }
                : undefined,
        };

        console.log({ orderData });
        // Create order
        const newOrder = await Order.create(orderData);

        let stripeClientSecret = null;
        if (body.paymentMethod === "stripe") {
            try {
                console.log({
                    amount: Math.round(total * 100),
                    currency: (
                        settings?.general?.currency || "AED"
                    ).toLowerCase(),
                });
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(total * 100),
                    currency: (
                        settings?.general?.currency || "AED"
                    ).toLowerCase(),
                    metadata: {
                        orderId,
                        customerEmail: body.email,
                        customerName: `${body.firstName} ${body.lastName}`,
                        orderTotal: total.toString(),
                    },
                    description: `Order ${orderId} payment`,
                    automatic_payment_methods: { enabled: true },
                });
                console.log({ paymentIntent });

                stripeClientSecret = paymentIntent.client_secret;
                newOrder.paymentIntentId = paymentIntent.id;
                newOrder.payments.push({
                    method: "stripe",
                    transactionId: paymentIntent.id,
                    gateway: "stripe",
                    status: "pending",
                    amount: total,
                    currency: (
                        settings?.general?.currency || "AED"
                    ).toLowerCase(),
                    createdAt: new Date(),
                });

                await newOrder.save();
            } catch (err) {
                console.error("Stripe error:", err);
                return res.status(500).json({
                    success: false,
                    error: "Failed to create payment intent",
                });
            }
        }
        console.log({ newOrder });
        const populated = await Order.findById(newOrder._id)
            .populate("products.product", "name thumbnail price mrp sku")
            .populate("user", "email")
            .populate("profile", "firstName lastName phone address");

        // Send confirmation emails for non-stripe orders only
        // Stripe orders will be confirmed via webhook after payment success
        // if (body.paymentMethod !== "stripe") {
        //     try {
        //         await sendOrderConfirmationEmails(newOrder._id);
        //     } catch (emailError) {
        //         console.error("Email sending error:", emailError);
        //         // Don't fail the order creation for email errors
        //     }
        // }

        return res.status(201).json({
            success: true,
            order: populated,
            orderId: newOrder.orderId,
            stripeClientSecret,
            summary: {
                subtotal: orderSubtotal,
                discount: discountAmount,
                tax: taxAmt,
                shipping: shippingCost,
                total,
            },
        });
    } catch (err) {
        console.error("createOrder error:", err);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }

    // assemble orderData

    //     const newOrder = await Order.create(orderData);

    //     const populated = await Order.findById(newOrder._id)
    //         .populate("products.product", "name thumbnail price mrp sku")
    //         .populate("user", "email")
    //         .populate("profile", "firstName lastName phone address");

    //     await sendOrderConfirmationEmails(newOrder._id);

    //     return res.status(201).json({
    //         success: true,
    //         order: populated,
    //         stripeClientSecret,
    //         paymentIntentId,
    //         summary: {
    //             subtotal: orderSubtotal,
    //             discount: discountAmount,
    //             tax: taxAmt,
    //             shipping: shippingCost,
    //             total,
    //         },
    //     });
    // } catch (err) {
    //     console.error("createOrder error:", err);
    //     return res.status(400).json({ success: false, error: err.message });
    // }
};
export const getOrderSummary = async (req, res) => {
    try {
        const body = req.body;
        const {
            products: frontendProducts,
            couponCode,
            shippingMethod,
        } = req.body;

        // Get settings
        const settings = await Settings.findOne({}).lean();
        if (!settings) {
            return res.status(500).json({ error: "Settings not found" });
        }

        // Validate products
        if (!Array.isArray(frontendProducts) || !frontendProducts.length) {
            return res.status(400).json({
                error: "No products provided",
            });
        }

        // Fetch products from database
        const productIds = frontendProducts.map((i) => i._id || i.product);
        const products = await Product.find({
            _id: { $in: productIds },
        }).lean();

        if (products.length !== frontendProducts.length) {
            return res.status(400).json({
                error: "Some products not found",
            });
        }

        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        // Build order products and calculate subtotal
        let orderSubtotal = 0;
        const orderProducts = frontendProducts.map((frontendItem) => {
            const productId = frontendItem._id || frontendItem.product;
            const dbProduct = productMap.get(productId.toString());

            if (!dbProduct) {
                throw new Error(`Product ${productId} not found`);
            }

            const quantity = frontendItem.quantity || 1;
            const price = dbProduct.price || 0;
            const originalPrice = dbProduct.mrp || price;
            const subtotal = price * quantity;

            orderSubtotal += subtotal;

            return {
                _id: dbProduct._id,
                name: dbProduct.name,
                sku: dbProduct.sku,
                price,
                originalPrice,
                quantity,
                subtotal,
                thumbnail: dbProduct.thumbnail,
            };
        });

        // Handle shipping method
        const selectedShippingMethod = shippingMethod
            ? settings.shipping.shippingMethods.find(
                  (method) => method.name === shippingMethod,
              )
            : settings.shipping.shippingMethods[0]; // Default to first method

        if (!selectedShippingMethod) {
            return res.status(400).json({
                error: "Invalid shipping method selected",
            });
        }

        let shippingCost = selectedShippingMethod.cost || 0;
        let discountAmount = 0;
        let couponMessage = "";
        let couponValid = false;

        // Handle coupon validation if provided
        if (couponCode && req.user) {
            try {
                // Check if user has previous orders
                const hasPreviousOrder = !!(await User.exists({
                    _id: req.user._id,
                    lastOrderDate: { $exists: true },
                }));

                const couponResult = await validateAndCalculateCoupon({
                    code: couponCode,
                    userId: req.user._id,
                    isFirstPurchase: !hasPreviousOrder,
                    shippingCost: selectedShippingMethod.cost,
                    cartItems: orderProducts,
                });

                const { valid, discount, freeShipping, newShipping, message } =
                    couponResult;

                couponValid = valid;
                couponMessage = message;

                if (valid && discount > 0) {
                    discountAmount = discount;
                    if (freeShipping) {
                        shippingCost = 0;
                    } else {
                        shippingCost = newShipping;
                    }
                }
            } catch (couponError) {
                console.error("Coupon validation error:", couponError);
                couponMessage = "Error validating coupon";
                couponValid = false;
            }
        }

        // Calculate tax and total
        const taxRate = settings?.tax?.taxRate || 0;
        const taxableAmount = orderSubtotal - discountAmount;
        const taxAmount = taxableAmount * (taxRate / 100);
        const total = orderSubtotal - discountAmount + taxAmount + shippingCost;

        // Prepare response
        const summary = {
            products: orderProducts,
            subtotal: orderSubtotal,
            discount: discountAmount,
            tax: {
                rate: taxRate,
                amount: taxAmount,
            },
            shipping: {
                method: selectedShippingMethod.name,
                cost: shippingCost,
                originalCost: selectedShippingMethod.cost || 0,
                isFree: shippingCost === 0 && selectedShippingMethod.cost > 0,
            },
            total,
            coupon: couponCode
                ? {
                      code: couponCode,
                      valid: couponValid,
                      message: couponMessage,
                      discountAmount: couponValid ? discountAmount : 0,
                  }
                : null,
            currency: settings?.general?.currency || "AED",
            availableShippingMethods: settings.shipping.shippingMethods.map(
                (method) => ({
                    name: method.name,
                    cost: method.cost || 0,
                    description: method.description,
                }),
            ),
        };

        return res.status(200).json({
            success: true,
            summary,
        });
    } catch (error) {
        console.error("Order summary error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to calculate order summary",
        });
    }
};
export const orderFullfill = async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).send("Missing orderId parameter");
    }

    try {
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
            return res.json({ success: false, error: "Order not found" });
        }
        // Trigger fulfillment immediately when customer lands on success page
        const orderResult = await fullfillCheckout(order);
        console.log({ orderResult: JSON.stringify(orderResult) });
        return res.status(200).json({
            success: true,
            order: orderResult,
        });
    } catch (error) {
        console.error("Error on success page:", error);
        return res.status(500).json({
            success: false,
            error: "Error processing your order. Please contact support.",
        });
    }
};

export const getOrder = async (req, res) => {
    try {
        const id = req.params.orderId;
        let order = await Order.findOne({ orderId: id })
            .populate(
                "products.product",
                "_id name thumbnail price mrp sku stock",
            )
            .lean();
        if (!order && mongoose.Types.ObjectId.isValid(id)) {
            order = await Order.findById(id)
                .populate(
                    "products.product",
                    "_id name thumbnail price mrp sku stock",
                )
                .lean();
        }
        if (!order) {
            return res.json({ success: false, error: "Order not found" });
        }
        return res.json(order);
    } catch (err) {
        console.error("getOrder error:", err);
        return res.status(500).json({ error: "Failed to fetch order" });
    }
};

// export const updateOrder = async (req, res) => {
// 	try {
// 		const id = req.params.orderId;
// 		const body = req.body;
// 		const order = await Order.findById(id);
// 		if (!order) {
// 			return res.status(404).json({ error: 'Order not found' });
// 		}

// 		// track status/payment changes
// 		const statusChanged = body.status && body.status !== order.status;
// 		const payChanged =
// 			body.paymentStatus && body.paymentStatus !== order.paymentStatus;
// 		const historyEntry = {
// 			status: body.status || order.status,
// 			paymentStatus: body.paymentStatus || order.paymentStatus,
// 			note: body.notes || 'Status updated',
// 			timestamp: new Date(),
// 		};
// 		if (statusChanged || payChanged) {
// 			body.history = [...(order.history || []), historyEntry];
// 		}

// 		// only allow carrier update for now
// 		const updateData = {};
// 		if (body.carrier) updateData.carrier = body.carrier;

// 		const updated = await Order.findByIdAndUpdate(id, updateData, {
// 			new: true,
// 			runValidators: true,
// 		});
// 		return res.json(updated);
// 	} catch (err) {
// 		console.error('updateOrder error:', err);
// 		return res.status(400).json({ error: 'Failed to update order' });
// 	}
// };

export const updateOrder = async (req, res) => {
    try {
        const id = req.params.orderId;
        const body = req.body;
        const order = await Order.findById(id);
        if (!order) {
            return res.json({ success: false, error: "Order not found" });
        }

        // --- MODIFIED: Track status/payment changes ---
        const previousStatus = order.status;
        const statusChanged = body.status && body.status !== order.status;
        const payChanged =
            body.paymentStatus && body.paymentStatus !== order.paymentStatus;
        const historyEntry = {
            status: body.status || order.status,
            paymentStatus: body.paymentStatus || order.paymentStatus,
            note: body.notes || "Status updated",
            timestamp: new Date(),
        };
        if (statusChanged || payChanged) {
            body.history = [...(order.history || []), historyEntry];
        }

        // --- MODIFIED: Allow status and paymentStatus updates ---
        const updateData = {};
        if (body.carrier) updateData.carrier = body.carrier;
        if (body.status) updateData.status = body.status;
        if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;
        if (body.history) updateData.history = body.history;

        const updated = await Order.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        // --- NEW: Send status update email if status changed ---
        if (statusChanged) {
            await sendStatusUpdateEmail(id, previousStatus);
        }

        return res.json(updated);
    } catch (err) {
        console.error("updateOrder error:", err);
        return res.status(400).json({ error: "Failed to update order" });
    }
};
// export const deleteOrder = async (req, res) => {
// 	try {
// 		const deleted = await Order.findByIdAndDelete(req.params.orderId);
// 		if (!deleted) {
// 			return res.status(404).json({ error: 'Order not found' });
// 		}
// 		return res.json({ success: true });
// 	} catch (err) {
// 		console.error('deleteOrder error:', err);
// 		return res.status(500).json({ error: 'Failed to delete order' });
// 	}
// };

export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        await sendOrderDeletionEmail(req.params.orderId);

        const deleted = await Order.findByIdAndDelete(req.params.orderId);
        return res.json({ success: true });
    } catch (err) {
        console.error("deleteOrder error:", err);
        return res.status(500).json({ error: "Failed to delete order" });
    }
};

export const trackOrder = async (req, res) => {
    try {
        const { orderId, trackingCode, email } = req.body;
        if (!orderId && !trackingCode) {
            return res
                .status(400)
                .json({ error: "Order ID or tracking code is required" });
        }

        const filter = {};
        if (orderId) filter.orderId = orderId;
        else if (trackingCode) filter.trackingCode = trackingCode;

        if (email) {
            filter["customer.email"] = email;
        } else {
            // const user = await getUserFromRequest(req);
            if (!user) {
                return res
                    .status(400)
                    .json({ error: "Email is required to track guest orders" });
            }
            filter["customer.email"] = user.email;
        }

        const order = await Order.findOne(filter)
            .populate("products.product", "name thumbnail price")
            .lean();

        if (!order) {
            return res
                .status(404)
                .json({ error: "Order not found or email does not match" });
        }
        return res.json({
            orderId: order.orderId,
            trackingCode: order.trackingCode,
            status: order.status,
            paymentStatus: order.paymentStatus,
            customer: order.customer,
            shippingAddress: order.shippingAddress,
            products: order.products,
            total: order.total,
            history: order.history,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        });
    } catch (err) {
        console.error("trackOrder error:", err);
        return res.status(500).json({ error: "Failed to track order" });
    }
};

export const listCustomerOrders = async (req, res) => {
    try {
        // const user = await getUserFromRequest(req);
        if (!user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const filter = { "customer.email": user.email };
        if (status) filter.status = status;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("products.product", "name thumbnail")
                .lean(),
            Order.countDocuments(filter),
        ]);

        return res.json({
            orders,
            totalOrders: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (err) {
        console.error("listCustomerOrders error:", err);
        return res
            .status(500)
            .json({ error: "Failed to fetch customer orders" });
    }
};

export const getOrderStatus = async (req, res) => {
    try {
        const statusCode = req.params.statusCode;
        const email = req.query.email;
        if (!email) {
            return res
                .status(400)
                .json({ error: "Email is required to verify order ownership" });
        }

        const order = await Order.findOne({
            $or: [{ orderId: statusCode }, { trackingCode: statusCode }],
            "customer.email": email,
        })
            .populate("products.product", "name thumbnail price")
            .lean();

        if (!order) {
            return res
                .status(404)
                .json({ error: "Order not found or email does not match" });
        }

        return res.json({
            orderId: order.orderId,
            trackingCode: order.trackingCode,
            status: order.status,
            paymentStatus: order.paymentStatus,
            history: order.history,
            shippingInfo: order.shippingInfo || null,
            estimatedDelivery: order.estimatedDelivery || null,
            lastUpdated: order.updatedAt,
        });
    } catch (err) {
        console.error("getOrderStatus error:", err);
        return res.status(500).json({ error: "Failed to fetch order status" });
    }
};

export const calculateTotals = async (req, res) => {
    try {
        const { items, region, shippingMethod } = req.body;
        if (!Array.isArray(items) || !items.length) {
            return res
                .status(400)
                .json({ error: "Invalid or empty cart items" });
        }

        const settings = await Settings.findOne({}).lean();
        const totals = calculateOrderTotals(
            items,
            settings,
            region || "Dubai",
            shippingMethod || "standard",
        );
        return res.json(totals);
    } catch (err) {
        console.error("calculateTotals error:", err);
        return res
            .status(500)
            .json({ error: "Failed to calculate order totals" });
    }
};
