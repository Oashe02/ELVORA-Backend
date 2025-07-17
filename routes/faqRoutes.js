import express from "express";
import  {
    getFaqs,
    createFaq,
    getFaqById,
    updateFaq,
    deleteFaq,
}  from "../controller/faqController.js";
import  {
    getCategoryById,
    updateCategory,
    deleteCategory,
    createCategory,
    getCategories,
} from "../controller/categoryController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
const router = express.Router();

// FAQs
router
    .route("/")
    .get(getFaqs) // GET  /api/faq
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createFaq,
    ); // POST /api/faq

router
    .route("/:id")
    .get(getFaqById) // GET    /api/faq/:id
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updateFaq,
    ) // PUT    /api/faq/:id
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deleteFaq,
    ); // DELETE /api/faq/:id



export default router;
