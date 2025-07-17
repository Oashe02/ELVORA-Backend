import express from "express";
const router = express.Router();
const analyticsController = require("../controller/analytics");

import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
router.get(
    "/enquiries",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    analyticsController.getUserEnquiryStats,
);

export default router;
