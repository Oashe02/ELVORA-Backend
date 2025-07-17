import express from "express";
const router = express.Router();
const { body, validationResult } = require("express-validator");
const faqController = require("../controller/faq");
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
// Validation middleware
const validateFAQ = [
    body("question").notEmpty().withMessage("Question is required"),
    body("answer").notEmpty().withMessage("Answer is required"),
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Routes
router.post(
    "/create",
    validateFAQ,
    handleValidationErrors,
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    faqController.createFAQ,
);

router.get(
    "/all/:siteName",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    faqController.getAllFAQs,
);
router.get(
    "/public-all/:siteName",
    passport.authenticate("user-rule", { session: false }),
    faqController.getAllPublicFaqs,
);

router.get("/single/:id", faqController.getFAQById);

router.post(
    "/update/:id",
    validateFAQ,
    handleValidationErrors,
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    faqController.updateFAQById,
);

router.delete(
    "/delete/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    faqController.deleteFAQById,
);

export default router;

