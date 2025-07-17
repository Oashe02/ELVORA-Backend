import express from "express";
import {
    submitContactForm,
    getContacts,
    updateContactStatus,
    deleteContact,
}  from "../controller/contactController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
const router = express.Router();

router.post("/", submitContactForm);
router.get(
    "/",
    passport.authenticate("user-rule", { session: false }),
    getContacts,
);
router.put(
    "/:id/status",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    updateContactStatus,
);
router.delete(
    "/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    deleteContact,
);

export default router;

