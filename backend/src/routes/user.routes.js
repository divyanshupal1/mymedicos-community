import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { loginUser,userAnswers,userComments, userPosts, userQuestions,userFlashcards } from "../controllers/user.controller.js";



const router = Router();

router.route('/login')
    .post(
        verifyJWT,
        loginUser
    );

router.route('/:id/comments')
    .get(
        userComments
    );

router.route('/:id/posts')
    .get(
        userPosts
    );

router.route('/:id/questions')
    .get(
        userQuestions
    );

router.route('/:id/answers')
    .get(
        userAnswers
    );

router.route('/:id/flashcards')
    .get(
        userFlashcards
    );

export default router;