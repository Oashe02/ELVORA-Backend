import express from "express";
import  {
    getMakes,
    createMake,
    getMakeByID,
    updateMake,
    deleteMake,
} from "../controller/makeController.js";

const router = express.Router();
import  passport from "passport";
import isAdmin from '../middleware/isAdmin.js';

// Collection routes
router
    .route("/")
    .get(getMakes) // GET  /api/categories?page=&limit=&status=
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createMake,
    ); // POST /api/categories

// Single-item routes
router
    .route("/:id")
    .get(getMakeByID) // GET    /api/categories/:id
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateMake,
    ) // PUT    /api/categories/:id
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteMake,
    ); // DELETE /api/categories/:id

export default router;

