import express from "express";
import  {
    getBanners,
    createBanner,
    getBannerById,
    updateBanner,
    deleteBanner,
} from "../controller/bannerController.js";
import  passport from "passport";
import isAdmin  from "../middleware/isAdmin.js";
const router = express.Router();

// Collection routes
router
    .route("/")
    .get(getBanners) // GET  /api/banners?page=&limit=&status=
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createBanner,
    ); // POST /api/banners

// Item routes
router
    .route("/:id")
    .get(passport.authenticate("user-rule", { session: false }), getBannerById) // GET    /api/banners/:id
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateBanner,
    ) // PUT    /api/banners/:id
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteBanner,
    ); // DELETE /api/banners/:id

export default router;

