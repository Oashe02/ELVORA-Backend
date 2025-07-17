import express from "express";
const router = express.Router();

import {
    listOrders,
    createOrder,
    getOrder,
    updateOrder,
    deleteOrder,
    trackOrder,
    listCustomerOrders,
    getOrderStatus,
    calculateTotals,
    orderFullfill,
    getOrderSummary,
} from "../controller/orderController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
import { fullfillCheckout } from "../utils/utils.js";
import Order from "../model/Order.js";
const optionalAuth = (req, res, next) => {
    passport.authenticate(
        "user-rule",
        { session: false },
        (err, user, info) => {
            if (err) {
                return next(err);
            }
            // Set user if authenticated, otherwise leave as undefined
            req.user = user || null;
            next();
        },
    )(req, res, next);
};
// Collection
router
    .route("/")
    .get(listOrders) // GET    /api/orders
    .post(
        // passport.authenticate("user-rule", { session: false }),
        // isAdmin,
        createOrder,
    ); // POST   /api/orders

router.post("/summary", optionalAuth, getOrderSummary);

// Tracking & misc
router.post("/track", trackOrder); // POST   /api/orders/track
router.get("/customer", listCustomerOrders); // GET    /api/orders/customer
router.get(
    "/status/:statusCode",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    getOrderStatus,
); // GET   /api/orders/status/:statusCode
router.post("/calculate", calculateTotals); // POST   /api/orders/calculate
router.post("/order-fullfill", orderFullfill);

// Single‐item
router
    .route("/:orderId")
    .get(getOrder) // GET    /api/orders/:orderId
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateOrder,
    ) // PUT    /api/orders/:orderId
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteOrder,
    ); // DELETE /api/orders/:orderId

export default router;

