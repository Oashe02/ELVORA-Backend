import express from "express";
import  {
    listProducts,
    createProduct,
    filterProducts,
    getProductAttributes,
    getProductById,
    updateProduct,
    deleteProduct,
    verifyPurchase,
    getProductSidebarFilters,
    searchProductsWithAtlas,
    getRecommendedProducts,
} from "../controller/productController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
const router = express.Router();

// /api/products
router
    .route("/")
    .get(listProducts) // GET  /api/products
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createProduct,
    ); // POST /api/products

// /api/products/filter
router.get("/filter", filterProducts);
router.get("/sidebar-filters", getProductSidebarFilters);
router.get("/search", searchProductsWithAtlas);

// /api/products/attributes
router.get("/attributes", getProductAttributes);

router.get("/recommended", getRecommendedProducts);

// /api/products/:id/verify-purchase
router.get("/:id/verify-purchase", verifyPurchase);

// /api/products/:id
router
    .route("/:id")
    .get(getProductById) // GET    /api/products/:id
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateProduct,
    ) // PUT    /api/products/:id
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteProduct,
    ); // DELETE /api/products/:id

export default router;

