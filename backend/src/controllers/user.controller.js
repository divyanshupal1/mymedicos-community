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
    const id = req.params.id
    const posts = await Post.find({ author: id,deleted: false });
    return res.status(200).json(
        new ApiResponse(200, { posts }, "My posts retrieved successfully")
    );
});

const userQuestions = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const questions = await Question.find({ author: id,deleted: false });
    return res.status(200).json(
        new ApiResponse(200, { questions }, "My questions retrieved successfully")
    );
});

export { 
    loginUser,
    userComments,
    userPosts,
    userQuestions,
};