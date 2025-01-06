import { body, param } from "express-validator";

// Validator for creating a comment on a post
const createCommentValidator = () => {
    return [
        // Validate that the body of the comment is not empty and is a string
        body("body")
            .notEmpty().withMessage("Comment body is required.")
            .isString().withMessage("Comment body must be a string."),

        // Validate that the postId in the URL is a valid ObjectId
        param("id")
            .isMongoId().withMessage("Invalid post ID."),

        // Optionally, validate that the parentComment (if provided) is a valid ObjectId
        body("parentComment")
            .optional()
            .isMongoId().withMessage("Invalid parent comment ID."),
    ];
};

const updateCommentValidator = () => {
    return [
        // Validate that the body of the comment is not empty and is a string
        body("body")
            .notEmpty().withMessage("Comment body is required.")
            .isString().withMessage("Comment body must be a string."),

        // Validate that the commentId in the URL is a valid ObjectId
        param("id")
            .isMongoId().withMessage("Invalid comment ID."),
    ];
};

export { createCommentValidator, updateCommentValidator };
