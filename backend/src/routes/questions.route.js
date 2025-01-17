import { Router } from "express";
import { getLoggedInUser, verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  createQuestionValidator,
  updateQuestionValidator,
  tagsValidator

} from "../validators/question.validator.js";
import { validate } from "../validators/validate.js";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestionsByLoggedUser,
  getQuestionsByTags,
  getRandomRecentQuestions,
} from "../controllers/question.controller.js";

const router = Router();

router
  .route("/")
  .post(verifyJWT, createQuestionValidator(), validate, createQuestion);

router
  .route("/my-questions")
  .get(verifyJWT, getQuestionsByLoggedUser);
  
router.route("/tags")
    .get(tagsValidator(),validate,getQuestionsByTags);

router.route("/feed")
    .get(getRandomRecentQuestions);

router
  .route("/:id")
  .get(getLoggedInUser,getQuestionById)
  .patch(verifyJWT, updateQuestionValidator(), validate, updateQuestion)
  .delete(verifyJWT, deleteQuestion);


export default router;
