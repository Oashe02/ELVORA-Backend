import express from "express";
const router = express.Router();
import { importEntities } from "../controller/importController.js";
import upload from "../middleware/memoryUpload.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";

router.post(
    "/generic-import",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    upload.single("file"),
    importEntities,
);

export default router;

