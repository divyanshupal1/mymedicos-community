import mongoose from "mongoose";
import { Question } from "../models/question.model.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createQuestion = asyncHandler(async (req, res) => {
    const { title, body, tags } = req.body;
    const question = new Question({
        title,
        body,
        tags,
        author:req.user.uid
    });
    const savedQuestion = await question.save();
    return res.status(201).json(
        new ApiResponse(201, { question: savedQuestion }, "Question created successfully")
    );
});

const updateQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, body, tags } = req.body;

    if(!title && !body && !tags){
        throw new ApiError(400,"At least one field is required to update the question")
    }

    const question = await Question.findById(id);

    if (!question) {
        throw new ApiError(404,"Question not found")
    }

    if (question.author.toString() !== req.user.uid) {
        throw new ApiError(403,"You are not authorized to update this question")
    }

    if (title !== undefined) question.title = title;
    if (body !== undefined) question.body = body;
    if (tags !== undefined) question.tags = tags;
    question.edited = true;
    question.updatedAt = Date.now();

    // Save the updated question
    const updatedQuestion = await question.save();

    return res.status(200).json(
        new ApiResponse(200, { question: updatedQuestion }, "Question updated successfully")
    );
});

const deleteQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find the question by ID
    const question = await Question.findById(id);

    if (!question) {
        throw new ApiError(404,"Question not found")
    }

    // Ensure the user is the author of the question
    if (question.author.toString() !== req.user.uid) {
        throw new ApiError(403,"You are not authorized to delete this question")
    }

    // Delete the question
    question.deleted = true;
    await question.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Question deleted successfully")
    );
});

const getQuestionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find the question by ID
    const question = await Question.findById(id);

    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    // Find related posts using the question ID
    const relatedPosts = await Post.aggregate([
        {
            $match: {
                question: mongoose.Types.ObjectId(id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "uid",
                as: "author",
            },
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" }, // Add a new field for the count of likes
                commentCount: { $size: "$comments" }, // Add a new field for the count of comments
            },
        },
        {
            $project: {
                body: 1,
                edited: 1,
                likeCount: 1,
                createdAt: 1,
                updatedAt: 1,
                "author.uid": 1,
                "author.name": 1,
                "author.email": 1,
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, { question, relatedPosts }, "Question retrieved successfully")
    );
});

const getQuestionsByLoggedUser = asyncHandler(async (req, res) => {
    const userId = req.user.uid;

    // Find all questions created by the logged-in user
    const questions = await Question.find({ author: userId }).sort({ createdAt: -1 });

    if (!questions.length) {
        return res.status(404).json(
            new ApiError(404, "No questions found for this user")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { questions }, "Questions retrieved successfully")
    );
});

const getQuestionsByTags = asyncHandler(async (req, res) => {

    let { tags } = req.query;

    if (typeof tags === 'string') {
        tags = tags.split(","); 
    }

    if (!Array.isArray(tags)) {
        throw new ApiError(400, "Tags should be an array of strings");
    }

    const questions = await Question.find({
        tags: { $in: tags }
    }).sort({ createdAt: -1 }).exec();


    return res.status(200).json(
        new ApiResponse(200, { questions }, "Questions retrieved successfully")
    );
});

const getRandomRecentQuestions = asyncHandler(async (req, res) => {
    const limit = 10; // Set the number of questions to fetch, you can adjust this number as needed

    // Aggregate query to get recently added questions
    const questions = await Question.aggregate([
        { $sort: { createdAt: -1 } }, // Sort by creation date in descending order (most recent first)
        { $limit: limit }, // Limit to the latest N questions
        { $sample: { size: limit } }, // Randomly shuffle the results
        {
            $project: {
                title: 1,
                body: 1,
                tags: 1,
                createdAt: 1,
                author: 1
            }
        }
    ]);

    if (!questions.length) {
        return res.status(404).json(
            new ApiError(404, "No questions found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, { questions }, "Random recent questions fetched successfully")
    );
});

export {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionById,
    getQuestionsByLoggedUser,
    getQuestionsByTags,
    getRandomRecentQuestions
}