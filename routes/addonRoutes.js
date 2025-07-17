import express from "express";
import  {
    getAddons,
    createAddon,
    getAddonById,
    updateAddon,
    deleteAddon,
}  from "../controller/addonController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
const router = express.Router();

// Collection routes
router
    .route("/")
    .get(getAddons) // GET  /api/categories?page=&limit=&status=
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createAddon,
    ); // POST /api/categories

// Single-item routes
router
    .route("/:id")
    .get(getAddonById) // GET    /api/categories/:id
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateAddon,
    ) // PUT    /api/categories/:id
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteAddon,
    ); // DELETE /api/categories/:id

export default router;

