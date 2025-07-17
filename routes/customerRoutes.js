import express from "express";

const router = express.Router();
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
import { getAllCustomer } from "../controller/customerController.js";
// Collection routes
router
    .route("/")
    .get(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        getAllCustomer,
    ); // GET  /api/categories?page=&limit=&status=

export default router;

