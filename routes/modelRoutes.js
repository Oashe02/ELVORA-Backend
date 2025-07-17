import express from "express";
import {
    getCarModels,
    createCarModels,
    getCarModelsByID,
    updateCarModel,
    deleteCarModel,
} from "../controller/modelController.js";

const router = express.Router();
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";

// Collection routes
router
    .route("/")
    .get(getCarModels) // GET  /api/categories?page=&limit=&status=
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createCarModels,
    ); // POST /api/categories

// Single-item routes
router
    .route("/:id")
    .get(getCarModelsByID) // GET    /api/categories/:id
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateCarModel,
    ) // PUT    /api/categories/:id
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteCarModel,
    ); // DELETE /api/categories/:id

export default router;

