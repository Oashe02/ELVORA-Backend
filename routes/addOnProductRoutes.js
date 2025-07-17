import express from "express";
import passport from "passport";
import isAdmin from "../middleware/isAdmin.js";

import {
    listProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    verifyPurchase,
    getRecommendedProducts,
} from "../controller/addOnProductController.js";

const router = express.Router();

// /api/addons (base route for addon products)
router
    .route("/")
    .get(listProducts) // GET  /api/addons
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createProduct
    ); // POST /api/addons

// /api/addons/recommended?productName=
router.get("/recommended", getRecommendedProducts);

// /api/addons/:id/verify-purchase
router.get("/:id/verify-purchase", verifyPurchase);

// /api/addons/:id
router
    .route("/:id")
    .get(getProductById) // GET    /api/addons/:id
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateProduct
    ) // PUT    /api/addons/:id
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteProduct
    ); // DELETE /api/addons/:id

export default router;
