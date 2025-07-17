import express from "express";
import {
    getManufactures,
    createManufactures,
    updateManfacture,
    deleteManufacture,
    getManufacturesByID,
} from "../controller/manufacturerController.js";

const router = express.Router();
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";

// Collection routes
router
    .route("/")
    .get(getManufactures) // GET  /api/categories?page=&limit=&status=
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createManufactures,
    ); // POST /api/categories

// Single-item routes
router
    .route("/:id")
    .get(getManufacturesByID) // GET    /api/categories/:id
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateManfacture,
    ) // PUT    /api/categories/:id
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteManufacture,
    ); // DELETE /api/categories/:id

export default router;

