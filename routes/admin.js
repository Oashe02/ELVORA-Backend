import express from "express";
const router = express.Router();
const adminController = require("../controller/admin");
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";

// Admin routes for managing users
router.put(
    "/create",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    adminController.createUser,
); // Create user
router.get(
    "/all/:siteName",
    passport.authenticate("user-rule", { session: false }),
    adminController.getAllUsers,
); // Create user

router.put(
    "/edit-role",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    adminController.editRole,
);
router.put(
    "/edit/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    adminController.editUser,
); // Edit user (except password)
// Edit user (except password)
router.put(
    "/reset-password/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    adminController.resetPassword,
); // Reset password
router.delete(
    "/delete/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    adminController.deleteUser,
); // Delete user
router.patch(
    "/ban-user/:id",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    adminController.blockUser,
); // Block/unblock user

export default router;
