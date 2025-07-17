// routes/dashboard.js
import express from "express";
import  {
    getDashboardData,
    getMyOrders,
} from "../controller/dashboardController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
const router = express.Router();

// GET /api/dashboard
router.get(
    "/",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    getDashboardData
);
router.get(
    "/my-orders",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    getMyOrders
);

export default router;

