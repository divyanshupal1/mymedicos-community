import mongoose from "mongoose";
import { Post } from "../models/post.model.js";
import { Question } from "../models/question.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comments.model.js";

const updateComment = asyncHandler(async (req, res) => {
    const { id } = req.params; // Get comment ID from params
    const { body } = req.body; // Get new body content from the request

    // Find the comment by ID
    const comment = await Comment.findById(id);
    
    if (!comment) {
        return res.status(404).json(
            new ApiError(404, "Comment not found")
        );
    }

    // Ensure the user is the author of the comment
    if (comment.author !== req.user.uid) {
        return res.status(403).json(
            new ApiError(403, "You are not authorized to update this comment")
        );
    }

    // Update the comment content
    comment.edited = true;  // Set the edited flag to true
    comment.body = body;  // You can update other fields as needed, e.g., title, etc.
    comment.updatedAt = Date.now();  // Update the updatedAt timestamp

    // Save the updated comment
    const updatedComment = await comment.save();

    return res.status(200).json(
        new ApiResponse(200, { comment: updatedComment }, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find the comment by ID
    const comment = await Comment.findById(id);

    if (!comment) {
        return res.status(404).json(
            new ApiError(404, "Comment not found")
        );
    }

    // Ensure the user is the author of the comment
    if (comment.author !== req.user.uid) {
        return res.status(403).json(
            new ApiError(403, "You are not authorized to delete this comment")
        );
    }

    comment.deleted = true;  // Set the deleted flag to true
    // Delete the comment
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
});

export {
    updateComment,
    deleteComment
}