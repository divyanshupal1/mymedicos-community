import admin from "../db/firebase.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comments.model.js";
import { Question } from "../models/question.model.js";
import { Post } from "../models/post.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const loginUser = asyncHandler(async (req, res) => {
    const user = await User.findOne({uid: req.user.uid});
    if(user){
        return res.status(200).json(
            new ApiResponse(200, { user }, "User logged in successfully")
        )
    }

    const userDoc = await admin.firestore().collection("users").where("Phone Number","==",req.user.phone_number).get();
    if(userDoc.empty){
        throw new ApiError(404, "User not found");
    }

    const userData = userDoc.docs[0].data();
    const newUser = new User({
        uid: req.user.uid,
        name: userData.Name,
        email: userData["Email ID"],
        phoneNumber: req.user.phone_number,
        photoURL:userData["Profile"],
        prefix: userData["Prefix"],
        interests: userData["Interests"] || [ userData["Interest"] ],
    });

    const savedUser = await newUser.save();
     return res.status(201).json(
        new ApiResponse(201, { user: savedUser }, "User")
     )
});

const userComments = asyncHandler(async (req, res) => {
    const id = req.params.id ;
    const comments = await Comment.find({ author: id, deleted: false });
    return res.status(200).json(
        new ApiResponse(200, { comments }, "My comments retrieved successfully")
    );
});

const userPosts = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const posts = await Post.aggregate([
        {
            $match: {
                author: id,
                deleted: false,
                post:true,
                flashcard:false
            }
        },
        {
            $addFields: {
              likeCount: { $size: "$likes" }, // Add a new field for the count of likes
              liked: { $in: [id || "", "$likes"] },
              commentCount: { $size: "$comments" },
            },
          },
          {
            $project: {
              body: 1,
              edited: 1,
              likeCount: 1,
              createdAt: 1,
              updatedAt: 1,
              flashcard: 1,
              post: 1,
              liked: 1,
              commentCount: 1,
              title: 1,
            },
          },
    ]);
    return res.status(200).json(
        new ApiResponse(200, { posts }, "My posts retrieved successfully")
    );
});

const userQuestions = asyncHandler(async (req, res) => {
    const id = req.params.id;
    // const questions = await Question.find({ author: id,deleted: false });
    const questions = await Question.aggregate([
        {
            $match: {
                author: id,
                deleted: false
            }
        },
        { $sort: { createdAt: -1 } }, // Sort by creation date in descending order // Limit to the latest N questions
        {
            $addFields: {
                postCount: { $size: "$posts" }, // Add a new field for the count of likes
            },
        },
        {
            $project: {
                title: 1,
                body: 1,
                tags: 1,
                edited: 1,
                createdAt: 1,
                postCount: 1, // Add a new field for the count of likes
            },
        },
    ]);
    return res.status(200).json(
        new ApiResponse(200, { questions }, "My questions retrieved successfully")
    );
});

const userAnswers = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const posts = await Post.aggregate([
        {
            $match: {
                author: id,
                deleted: false,
                post:false,
                flashcard:false
            }
        },
        {
            $lookup: {
              from: "questions", // Collection name in the same database
              localField: "question",
              foreignField: "_id",
              as: "question",
            },
        },
        { $unwind: "$question"
        },
        {
            $addFields: {
              likeCount: { $size: "$likes" }, // Add a new field for the count of likes
              liked: { $in: [id || "", "$likes"] },
              commentCount: { $size: "$comments" },
            },
          },
          {
            $project: {
              body: 1,
              edited: 1,
              likeCount: 1,
              createdAt: 1,
              updatedAt: 1,
              flashcard: 1,
              post: 1,
              liked: 1,
              commentCount: 1,
              "question.title": 1,
              "question._id" : 1,
            },
          },
    ]);
    return res.status(200).json(
        new ApiResponse(200, { answers:posts }, "My answers retrieved successfully")
    );
});

const userFlashcards = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const posts = await Post.aggregate([
        {
            $match: {
                author: id,
                deleted: false,
                post:false,
                flashcard:true
            }
        },
        {
            $addFields: {
              likeCount: { $size: "$likes" }, // Add a new field for the count of likes
              liked: { $in: [id || "", "$likes"] },
              commentCount: { $size: "$comments" },
            },
          },
          {
            $project: {
              body: 1,
              edited: 1,
              likeCount: 1,
              createdAt: 1,
              updatedAt: 1,
              flashcard: 1,
              post: 1,
              liked: 1,
              commentCount: 1,
              title: 1,
              readtime: 1,
            },
          },
    ]);
    return res.status(200).json(
        new ApiResponse(200, { flashcards:posts }, "My flashcard retrieved successfully")
    );
});

export { 
    loginUser,
    userComments,
    userPosts,
    userQuestions,
    userAnswers,
    userFlashcards
};