import express from "express";
import  {
    getOffers,
    createOffer,
    getOfferById,
    updateOffer,
    deleteOffer,
    trackOfferMetric,
} from "../controller/offerController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
const router = express.Router();
// /api/offers
router
    .route("/")
    .get(getOffers) // GET  /api/offers
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createOffer,
    ); // POST /api/offers

// /api/offers/:id
router
    .route("/:id")
    .get(getOfferById) // GET    /api/offers/:id
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateOffer,
    ) // PUT    /api/offers/:id
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteOffer,
    ) // DELETE /api/offers/:id
    .patch(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        trackOfferMetric,
    ); // PATCH  /api/offers/:id

export default router;

