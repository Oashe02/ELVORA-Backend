import express from "express";
const router = express.Router();
const newsletterController = require("../controller/newsletter"); // Adjust the path as necessary
const { body, validationResult } = require("express-validator");
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";

// Validation middleware
const validateNewsletter = [
    body("title").notEmpty().withMessage("Title is required"),
    body("siteName").isIn(["3d", "4d"]).withMessage("Invalid site name"),
    body("imageUrl").optional().isURL().withMessage("Invalid URL for image"),
    body("NewsletterContent")
        .notEmpty()
        .withMessage("Newsletter content is required"),
];

// Middleware to handle validation results
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
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    validateNewsletter,
    handleValidationErrors,
    newsletterController.createNewsletter,
);

router.get(
    "/public-all/:siteName",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    newsletterController.getAllPublicNewsletters,
);

router.get(
    "/all/:siteName",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    newsletterController.getAllNewsletters,
);

router.get(
    "/single/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    newsletterController.getNewsletterById,
);

router.post(
    "/update/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    validateNewsletter,
    handleValidationErrors,
    newsletterController.updateNewsletterById,
);

router.delete(
    "/delete/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    newsletterController.deleteNewsletterById,
);

export default router;

