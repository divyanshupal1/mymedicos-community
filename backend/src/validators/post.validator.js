import { body, param } from "express-validator";

const createPostValidator = () => {
    return [
        body("body")
            .notEmpty()
            .withMessage("Post body is required")
            .isString()
            .withMessage("Post body must be a string")
            .isLength({ min: 10 })
            .withMessage("Post body must be at least 10 characters long"),
    ];
};

const updatePostValidator = () => {
    return [
        param("id")
            .notEmpty()
            .withMessage("Post ID is required")
            .isMongoId()
            .withMessage("Post ID must be a valid MongoDB ObjectId"),
        body("body")
            .optional()
            .isString()
            .withMessage("Post body must be a string")
            .isLength({ min: 10 })
            .withMessage("Post body must be at least 10 characters long"),
    ];
};

export { createPostValidator, updatePostValidator };
