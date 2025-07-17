import express from "express";
import  {
    getCoupons,
    createCoupon,
    validateCoupon,
    getFeaturedCoupon,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    setCouponFeatured,
}  from "../controller/couponController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
const router = express.Router();

// /api/coupons
router
    .route("/")
    .get(getCoupons) // list & filter
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createCoupon,
    ); // create

// POST /api/coupons/validate
router.post(
    "/validate",
    // passport.authenticate("user-rule", { session: false }),
    validateCoupon,
);

// GET /api/coupons/featured
router.get("/featured", getFeaturedCoupon);

// /api/coupons/:id
router
    .route("/:id")
    .get(getCouponById)
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateCoupon,
    )
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteCoupon,
    );

// PATCH /api/coupons/:id/featured
router.patch(
    "/:id/featured",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    setCouponFeatured,
);

export default router;

