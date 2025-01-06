import mongoose from "mongoose";
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    post: { 
        type: Schema.Types.ObjectId, 
        ref: "Post", 
        required: true 
    },
    parentComment: { 
        type: Schema.Types.ObjectId, 
        ref: "Comment", 
        default: null 
    },
    deleted: {
        type: Boolean,
        default: false
    } ,
    body: { 
        type: String, 
        required: true 
    },
    author: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
});

CommentSchema.pre("save", function (next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

CommentSchema.index({ post: 1, author: 1 });

export const Comment = mongoose.model("Comment", CommentSchema);
