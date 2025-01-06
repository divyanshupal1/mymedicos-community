import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { updateCommentValidator } from "../validators/comment.validator.js";
import { updateComment, deleteComment } from "../controllers/comment.controller.js";
import { validate } from "../validators/validate.js";

const router = Router();

router.route('/:id')
    .patch(
        verifyJWT,
        updateCommentValidator(),
        validate,
        updateComment
    )
    .delete(
        verifyJWT,
        deleteComment
    )

export default router;