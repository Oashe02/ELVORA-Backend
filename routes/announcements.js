import express from "express";

import {
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncements,
    createAnnouncement,
}  from "../controller/announcements.js";
import isAdmin  from "../middleware/isAdmin.js";
import  passport  from "passport";

const router = express.Router();

router.get("/", getAnnouncements);
router.post(
    "/",
    passport.authenticate("user-rule", { session: false }),
    isAdmin,
    createAnnouncement,
);
router
    .route("/:id")
    .get(
        passport.authenticate("user-rule", { session: false }),
        getAnnouncementById,
    )
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateAnnouncement,
    )
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteAnnouncement,
    );
    export default router;
