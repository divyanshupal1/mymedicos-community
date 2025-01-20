import { Router } from "express";
import { 
    getLoggedInUser, 
    verifyJWT 
} from "../middlewares/auth.middlewares.js";
import {
    createPostValidator,
    updatePostValidator,
} from "../validators/post.validator.js";
import { validate } from "../validators/validate.js";
import {
    createPost,
    deletePost,
    updatePost,
    getPostById,
    getPostComments,
    commentOnPost,
    likePost,
    getFlashcardFeed,
    getPostFeed,
} from "../controllers/post.controller.js";
import { createCommentValidator } from "../validators/comment.validator.js";

const router = Router();

router.route("/").post(verifyJWT, createPostValidator(), validate, createPost);

router.route("/feed").get(
    getLoggedInUser, 
    getPostFeed
)

router
    .route("/flashcards/feed")
    .get(
        getLoggedInUser, 
        getFlashcardFeed
    );

router
    .route("/:id")
    .get(
        getLoggedInUser, 
        getPostById
    )
    .patch(
        verifyJWT, 
        updatePostValidator(), 
        validate, 
        updatePost
    )
    .delete(
        verifyJWT, 
        deletePost
    );

router
    .route("/:id/comments")
    .get(
        getPostComments
    )
    .post(
        verifyJWT, 
        createCommentValidator(), 
        validate, 
        commentOnPost
    );

router
    .route("/:id/like")
    .patch(
        verifyJWT, 
        likePost
    );


export default router;
