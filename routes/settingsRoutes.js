import express from "express";
import  {
    getAllSettings,
    updateAllSettings,
    getTaxSettings,
    updateTaxSettings,
    getShippingSettings,
    updateShippingSettings,
    getPaymentSettings,
    updatePaymentSettings,
    getGeneralSettings,
    updateGeneralSettings,
} from "../controller/settingsController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
const router = express.Router();

// /api/settings
router
    .route("/")
    .get(getAllSettings)
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateAllSettings,
    );

// /api/settings/tax
router
    .route("/tax")
    .get(getTaxSettings)
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateTaxSettings,
    );

// /api/settings/shipping
router
    .route("/shipping")
    .get(getShippingSettings)
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateShippingSettings,
    );

// /api/settings/payment
router
    .route("/payment")
    .get(getPaymentSettings)
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updatePaymentSettings,
    );

// /api/settings/general
router
    .route("/general")
    .get(getGeneralSettings)
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateGeneralSettings,
    );

export default router;

