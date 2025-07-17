import Order from "../model/Order.js";
import Category from "../model/Category.js";
import Coupon from "../model/Coupon.js";
import Banner from "../model/Banner.js";
import User from "../model/User.js";
import Product from "../model/Product.js";
import Profile from "../model/Profile.js";
import { startOfDay, startOfMonth, subMonths } from "date-fns";


// Simple in-memory cache (resets on server restart)
const DASHBOARD_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
let dashboardCache = { data: null, expires: 0 };

export const getDashboardData = async (req, res) => {
    try {
        // Serve from cache when valid
        // if (dashboardCache.data && dashboardCache.expires > Date.now()) {
        // 	return res.json(dashboardCache.data);
        // }

        console.log("Fetching dashboard data for user:", req.user._id);

        // Determine query scope (admin = all orders)

        // counts
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: "pending" });
        const processingOrders = await Order.countDocuments({
            status: "processing",
        });
        const completeOrders = await Order.countDocuments({
            status: "delivered",
        });

        console.log({
            totalOrders,
            pendingOrders,
            processingOrders,
            completeOrders,
        });
        // recent 10 orders, newest first
        // const recentOrders = await Order.find({
        // 	user: req.user._id,
        // })
        // 	.sort({ createdAt: -1 })
        // 	.limit(10)
        // 	.select("orderId createdAt status total")
        // 	.lean();
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select(
                "orderId createdAt status total subtotal tax discount shippingCharge paymentStatus paymentMethod carrier estimatedDeliveryDate actualDeliveryDate fulfillmentType couponCode trackingNumber products",
            )
            .populate({
                path: "products.product",
                select: "name thumbnail sku",
            })
            .lean();

        // Reshape recentOrders for frontend consistency
        // const formattedRecentOrders = recentOrders.map((o) => ({
        // 	orderId: o.orderId,
        // 	createdAt: o.createdAt,
        // 	status: o.status,
        // 	total: o.total,
        // 	subtotal: o.subtotal || 0,
        // 	tax: o.tax || 0,
        // 	discount: o.discount || 0,
        // 	shippingCharge: o.shippingCharge || 0,
        // 	paymentStatus: o.paymentStatus || "Unknown",
        // 	paymentMethod: o.paymentMethod || "N/A",
        // 	carrier: o.carrier || null,
        // 	estimatedDeliveryDate: o.estimatedDeliveryDate || null,
        // 	actualDeliveryDate: o.actualDeliveryDate || null,
        // 	fulfillmentType: o.fulfillmentType || null,
        // 	couponCode: o.couponCode || null,
        // 	tracking: o.trackingNumber || null,
        // 	items: o.products.map((p) => ({
        // 		name: p?.product?.name || "Unnamed Product",
        // 		quantity: p?.quantity || 0,
        // 		price: p?.price || 0,
        // 		thumbnail: p?.product?.thumbnail || "/placeholder.svg",
        // 		sku: p?.product?.sku || null,
        // 		variant: p?.variant || null,
        // 		subtotal: p?.subtotal || p?.price * p?.quantity || 0,
        // 		tax: p?.tax || 0,
        // 		discounts: p?.discounts || [],
        // 	})),
        // 	history: o.history
        // 		? o.history.map((h) => ({
        // 				status: h.status,
        // 				paymentStatus: h.paymentStatus,
        // 				note: h.note || null,
        // 				timestamp: h.timestamp,
        // 				updatedBy: h.updatedBy || null,
        // 		  }))
        // 		: [],
        // }));

        // Extra: cancelled & revenue (paid orders total)
        // Additional entity counts (global – not scoped)
        const [totalCategories, totalCustomers, totalCoupons, totalBanners] =
            await Promise.all([
                Category.countDocuments(),
                User.countDocuments({ role: "customer" }),
                Coupon.countDocuments(),
                Banner.countDocuments(),
            ]);

        const cancelledOrders = await Order.countDocuments({
            status: "cancelled",
        });
        // Best-seller products (top 10 by quantity sold within filter scope)
        const bestSellerAgg = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.product",
                    totalQty: { $sum: "$products.quantity" },
                    totalSales: { $sum: "$products.subtotal" },
                },
            },
            { $sort: { totalQty: -1 } },
            { $limit: 10 },
        ]);
        const bestSellerProductIds = bestSellerAgg.map((b) => b._id);
        const bestSellerProductsData = await Product.find({
            _id: { $in: bestSellerProductIds },
        })
            .select("name thumbnail price sku stock")
            .lean();
        const bestSellerProducts = bestSellerAgg.map((b) => ({
            product: bestSellerProductsData.find(
                (p) => p._id.toString() === b._id.toString(),
            ),
            totalQty: b.totalQty,
            totalSales: b.totalSales,
        }));

        // Revenue this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthRevenueAgg = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "paid",
                    createdAt: { $gte: monthStart },
                },
            },
            { $group: { _id: null, revenue: { $sum: "$total" } } },
        ]);
        const thisMonthRevenue = thisMonthRevenueAgg[0]?.revenue || 0;

        // Revenue for last 12 months (inclusive)
        const last12MonthStart = subMonths(now, 11); // 0..11
        const monthlyRevenueAgg = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "paid",
                    createdAt: { $gte: last12MonthStart },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    revenue: { $sum: "$total" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);
        const monthlyRevenue = monthlyRevenueAgg.map((r) => ({
            month: `${r._id.year}-${String(r._id.month).padStart(2, "0")}`,
            revenue: r.revenue,
        }));

        // Order status distribution for pie
        const statusDistributionAgg = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const statusDistribution = statusDistributionAgg.reduce((acc, cur) => {
            acc[cur._id || "unknown"] = cur.count;
            return acc;
        }, {});

        const totalRevenueAgg = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $group: { _id: null, revenue: { $sum: "$total" } } },
        ]);
        const totalRevenue = totalRevenueAgg[0]?.revenue || 0;
        const recentCustomers = await Profile.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select("firstName lastName phone emirate city state country createdAt user")
            .populate("user", "email")
            .lean();
        console.log("recentCustomers", recentCustomers);
        const responsePayload = {
            totalOrders,
            pendingOrders,
            processingOrders,
            completeOrders,
            cancelledOrders,
            totalRevenue,
            totalCategories,
            totalCustomers,
            totalCoupons,
            totalBanners,
            recentOrders,
            recentCustomers,
            bestSellerProducts,
            analytics: {
                thisMonthRevenue,
                monthlyRevenue,
                statusDistribution,
            },
        };

        // update cache
        dashboardCache = {
            data: responsePayload,
            expires: Date.now() + DASHBOARD_CACHE_TTL,
        };

        return res.json(responsePayload);
    } catch (err) {
        console.error("Dashboard data error:", err);
        return res.status(500).json({ error: "Failed to load dashboard data" });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        // Fetch user's orders, newest first
        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .select(
                "orderId createdAt status trackingNumber total products paymentStatus paymentMethod subtotal tax discount shippingCharge carrier estimatedDeliveryDate actualDeliveryDate fulfillmentType history couponCode",
            )
            .populate({
                path: "products.product",
                select: "name thumbnail sku",
            })
            .lean();

        // Reshape for frontend
        const payload = orders.map((o) => ({
            orderId: o.orderId,
            placedOn: o.createdAt,
            status: o.status,
            tracking: o.trackingNumber || o.trackingCode || null,
            total: o.total,
            subtotal: o.subtotal,
            tax: o.tax || 0,
            discount: o.discount || 0,
            shippingCharge: o.shippingCharge || 0,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            carrier: o.carrier || null,
            estimatedDeliveryDate: o.estimatedDeliveryDate || null,
            actualDeliveryDate: o.actualDeliveryDate || null,
            fulfillmentType: o.fulfillmentType,
            couponCode: o.couponCode || null,
            items: o.products.map((p) => ({
                name: p?.name || p?.product.name,
                quantity: p?.quantity,
                price: p?.price,
                thumbnail: p?.product?.thumbnail,
                sku: p?.product?.sku || null,
                variant: p?.variant || null,
                subtotal: p?.subtotal || p?.price * p?.quantity,
                tax: p?.tax || 0,
                discounts: p?.discounts || [],
            })),
            history: o.history
                ? o.history.map((h) => ({
                      status: h.status,
                      paymentStatus: h.paymentStatus,
                      note: h.note || null,
                      timestamp: h.timestamp,
                      updatedBy: h.updatedBy || null,
                  }))
                : [],
        }));

        return res.json(payload);
    } catch (err) {
        console.error("getMyOrders error:", err);
        return res.status(500).json({ error: "Unable to fetch your orders." });
    }
};
