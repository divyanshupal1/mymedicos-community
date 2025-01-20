import mongoose from "mongoose";
import { Post } from "../models/post.model.js";
import { Question } from "../models/question.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comments.model.js";

const createPost = asyncHandler(async (req, res) => {
  const { question, body } = req.body;
  const author = req.user.uid;

  const flashcard  = req.body?.flashcard || false;
  const post = req.body?.post || false;
  const tags = req.body?.tags || [];
  const title = req.body?.title || null;
  const readtime = req.body?.readtime || null;

  if(!flashcard && !post){

    const questionExists = await Question.findById(question);
    if (!questionExists) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    const newPost = new Post({
      question,
      body,
      author,
      flashcard
    });

    const savedPost = await newPost.save();
    questionExists.posts.push(savedPost._id);
    await questionExists.save();

    return res.status(201).json(
      new ApiResponse(201, { post: savedPost}, "Post created successfully")
    );
  }
  else{
    if(flashcard && readtime==null){
      throw new ApiError(400, "Readtime is required for flashcards");
    }
    if(title==null){
      throw new ApiError(400, "Title is required for flashcards and posts");
    }

    const newPost = new Post({
      body,
      author,
      flashcard,
      post,
      tags,
      title,
      readtime
    });

    const savedPost = await newPost.save();

    return res.status(201).json(
      new ApiResponse(201, { post: savedPost}, "Post created successfully")
    );
  }
});

const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "uid",
        as: "author",
      },
    },
    { $unwind: "$author" },
    {
      $addFields: {
        likeCount: { $size: "$likes" }, // Add a new field for the count of likes
        liked: { $in: [req?.user?.uid || "", "$likes"] },
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
        "author.uid": 1,
        "author.name": 1,
        "author.email": 1,
        "author.photoURL": 1,
        liked: 1,
        commentCount: 1,
      },
    },
  ]);

  if (!post[0]) {
    throw new ApiError(404, "Post not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { ...post[0] }, "Post retrieved successfully"));
});

const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params; // Get post ID from params
  const { body } = req.body; // Get new body content from the request

  // Find the post by ID
  const post = await Post.findById(id);

  if (!post) {
    return res.status(404).json(new ApiError(404, "Post not found"));
  }

  // Ensure the user is the author of the post
  if (post.author !== req.user.uid) {
    return res
      .status(403)
      .json(new ApiError(403, "You are not authorized to update this post"));
  }

  // Update the post content
  post.edited = true; // Set the edited flag to true
  post.body = body; // You can update other fields as needed, e.g., title, etc.
  post.updatedAt = Date.now(); // Update the updatedAt timestamp

  // Save the updated post
  const updatedPost = await post.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { post: updatedPost }, "Post updated successfully")
    );
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the post by ID
  const post = await Post.findById(id);

  if (!post || post.deleted) {
    throw new ApiError(404, "Post not found");
  }

  // Ensure the user is the author of the post
  if (post.author.toString() !== req.user.uid) {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  // Delete the post
  post.deleted = true;
  await post.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Post deleted successfully"));
});

const getPostComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  if (!post) {
    return res.status(404).json({
      message: "Post not found",
    });
  }
  const comments = await Comment.aggregate([
    { $match: { post: new mongoose.Types.ObjectId(id) } }, // Match comments belonging to the given post
    {
      $lookup: {
        from: "users", // Replace with your users collection name
        localField: "author",
        foreignField: "uid",
        as: "author",
      },
    },
    { $unwind: "$author" }, // Flatten the 'authorDetails' array
    {
      $project: {
        body: 1,
        createdAt: 1,
        updatedAt: 1,
        "author.name": 1,
        "author.photoURL": 1,
        "author.uid": 1,
        parentComment: 1, // Include parentComment to distinguish sub-comments
      },
    },
    { $sort: { createdAt: 1 } }, // Sort comments by creation date (optional)
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { comments }, "Comments retrieved successfully")
    );
});

const commentOnPost = asyncHandler(async (req, res) => {
  const { body, parentComment } = req.body; // body is the comment text, parentComment is optional for replies
  const postId = req.params.id; // Post ID from the URL params

  // Ensure the post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Create the new comment
  const newComment = new Comment({
    post: postId,
    body,
    author: req.user.uid, // Assuming req.user.uid contains the logged-in user's UID
    parentComment: parentComment
      ? new mongoose.Types.ObjectId(parentComment)
      : null,
  });

  // Save the comment to the database
  await newComment.save();

  // Add the comment ID to the post's comments array
  post.comments.push(newComment._id);
  await post.save();

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { comment: newComment },
        "Comment added successfully"
      )
    );
});

const likePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;
  // const post = await Post.findById(id);
  const session = await mongoose.startSession();

  session.startTransaction();

  // Find the post within the transaction
  const post = await Post.findById(id).session(session);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Determine if the post is already liked
  const liked = post.likes.includes(userId);

  // Update the likes array based on the current status
  if (liked) {
    // Remove the like
    post.likes = post.likes.filter((uid) => uid !== userId);
  } else {
    // Add the like
    post.likes.push(userId);
  }

  // Save the updated post within the transaction
  await post.save({ session });

  
  // Commit the transaction
  await session.commitTransaction();
  session.endSession();

  const newpost = await Post.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "uid",
        as: "author",
      },
    },
    { $unwind: "$author" },
    {
      $addFields: {
        likeCount: { $size: "$likes" }, // Add a new field for the count of likes
        liked: { $in: [req?.user?.uid || "", "$likes"] },
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
        "author.uid": 1,
        "author.name": 1,
        "author.email": 1,
        "author.photoURL": 1,
        liked: 1,
        commentCount: 1,
      },
    },
  ]);


  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      { ...newpost[0]},
      `Post ${liked ? "unliked" : "liked"} successfully`
    )
  );
});

const getFlashcardFeed = asyncHandler(async (req, res) => {
  const limit = 10; // Set the number of questions to fetch, you can adjust this number as needed

  // Aggregate query to get recently added questions
  const flashcards = await Post.aggregate([
      { $match: { flashcard: true } }, // Match only flashcard posts
      { $sort: { createdAt: -1 } }, // Sort by creation date in descending order
      // { $limit: limit }, // Limit to the latest N questions
      {
          $lookup: {
              from: "users",
              localField: "author",
              foreignField: "uid",
              as: "author",
          },
      },
      { $unwind: "$author" },
      {
        $addFields: {
          likeCount: { $size: "$likes" }, // Add a new field for the count of likes
          liked: { $in: [req?.user?.uid || "", "$likes"] },
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
          "author.uid": 1,
          "author.name": 1,
          "author.email": 1,
          "author.photoURL": 1,
          liked: 1,
          commentCount: 1,
          flashcard: 1,
          post: 1,
          title: 1,
          readtime:1,
        },
      },
  ]);
  

  if (!flashcards.length) {
    throw new ApiError(404, "No flashcards found");
  }

  return res.status(200).json(
      new ApiResponse(200, { flashcards }, "Random recent flashcards fetched successfully")
  );
});
const getPostFeed = asyncHandler(async (req, res) => {
  // Set the number of questions to fetch, you can adjust this number as needed

  // Aggregate query to get recently added questions
  const posts = await Post.aggregate([
      { $match: { flashcard: false,post:true } }, // Match only flashcard posts
      { $sort: { createdAt: -1 } }, // Sort by creation date in descending order
      // { $limit: limit }, // Limit to the latest N questions
      {
          $lookup: {
              from: "users",
              localField: "author",
              foreignField: "uid",
              as: "author",
          },
      },
      { $unwind: "$author" },
      {
        $addFields: {
          likeCount: { $size: "$likes" }, // Add a new field for the count of likes
          liked: { $in: [req?.user?.uid || "", "$likes"] },
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
          "author.uid": 1,
          "author.name": 1,
          "author.email": 1,
          "author.photoURL": 1,
          liked: 1,
          commentCount: 1,
          flashcard: 1,
          post: 1,
          title: 1,
          readtime:1,
        },
      },
  ]);
  

  if (!posts.length) {
    throw new ApiError(404, "No flashcards found");
  }

  return res.status(200).json(
      new ApiResponse(200, { posts }, "Random recent flashcards fetched successfully")
  );
});

export {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getPostComments,
  commentOnPost,
  likePost,
  getFlashcardFeed,
  getPostFeed
};
