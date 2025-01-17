import mongoose, { SchemaType } from "mongoose";
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    question: {
        type: Schema.Types.ObjectId,
        ref: "Question",
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    likes:{
        type: [String],
        default: [],
    },
    edited: {
        type: Boolean,
        default: false,
    },
    posts:{
        type: [Schema.Types.ObjectId],
        ref: "Post",
        default: [],
    },
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

PostSchema.pre("save", function (next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});
PostSchema.index({ question: 1, author: 1 });

export const Post = mongoose.model("Post", PostSchema);
