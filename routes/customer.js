import express from "express";
const router = express.Router();
const customerController = require("../controller/customer");
import isAdmin from "../middleware/isAdmin.js";
import  passport from "passport";
router.get(
    "/all/:siteName",
    passport.authenticate("user-rule", { session: false }),
    customerController.getAllCustomer,
);

// Create a new customer
router.post(
    "/create",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    customerController.createCustomer,
);

// Update an existing customer by ID
router.put(
    "/update/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    customerController.updateCustomer,
);

// Delete a customer by ID
router.delete(
    "/delete/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    customerController.deleteCustomer,
);

export default router;

