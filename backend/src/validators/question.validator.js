
import { body, param,query } from "express-validator";

// Validator for creating a question
const createQuestionValidator = () => {
    return [
        body("title")
            .notEmpty()
            .withMessage("Question title is required")
            .isString()
            .withMessage("Title must be a string"),
        
        body("body")
            .notEmpty()
            .withMessage("Question body is required")
            .isString()
            .withMessage("Body must be a string"),
        
        body("tags")
            .optional()
            .isArray()
            .withMessage("Tags must be an array")
            .custom((tags) => tags.every(tag => typeof tag === 'string'))
            .withMessage("All tags must be strings"),
    ];
};

const tagsValidator = () => {
    return [
        query("tags")
            .notEmpty()
            .withMessage("Tags are required")
            .isString()
            .withMessage("Tags must be an array")
            .custom(
                (tags) => tags.split(",").every((tag) => typeof tag === "string")
            )
            .withMessage("All tags must be strings"),
    ];
};

// Validator for updating a question
const updateQuestionValidator = () => {
    return [
        param("id")
            .notEmpty()
            .withMessage("Question ID is required")
            .isMongoId()
            .withMessage("Invalid Question ID"),
        
        body("title")
            .optional()
            .isString()
            .withMessage("Title must be a string"),
        
        body("body")
            .optional()
            .isString()
            .withMessage("Body must be a string"),
        
        body("tags")
            .optional()
            .isArray()
            .withMessage("Tags must be an array")
            .custom((tags) => tags.every(tag => typeof tag === 'string'))
            .withMessage("All tags must be strings"),
    ];
};

export {
    createQuestionValidator,
    updateQuestionValidator,
    tagsValidator
};
