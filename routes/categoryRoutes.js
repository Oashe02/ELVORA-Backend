import express from "express";
import  {
    getCategories,
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory,
}  from "../controller/categoryController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
const router = express.Router();

// Collection routes
router
    .route("/")
    .get(getCategories) // GET  /api/categories?page=&limit=&status=
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createCategory,
    ); // POST /api/categories

// Single-item routes
router
    .route("/:id")
    .get(getCategoryById) // GET    /api/categories/:id
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateCategory,
    ) // PUT    /api/categories/:id
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteCategory,
    ); // DELETE /api/categories/:id

export default router;

