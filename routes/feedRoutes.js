import express from "express";
import {
    getPosts,
    createPost,
    getPostById,
    updatePost,
    deletePost,
} from "../controller/feedController.js";
import  passport from "passport";
import isAdmin from "../middleware/isAdmin.js";
const router = express.Router();

// GET /api/feed?page=&limit=&status=&tag=
// POST /api/feed
router
    .route("/")
    .get(getPosts)
    .post(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        createPost,
    );


    router.get('/public', getPosts);


// GET, PUT, DELETE /api/feed/:id
router
    .route("/:id")
    .get(getPostById)
    .put(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        updatePost,
    )
    .delete(
        passport.authenticate("user-rule", { session: false }),
        isAdmin,
        deletePost,
    );

export default router;

