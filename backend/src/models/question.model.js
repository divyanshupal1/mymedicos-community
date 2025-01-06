import mongoose from "mongoose";
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    title: { 
        type: String, 
        required: true 
    },
    body: { 
        type: String, 
        required: true 
    },
    tags: {
        type: [String],
        default: []
    },
    deleted: {
        type: Boolean,
        default: false
    },
    edited:{
        type: Boolean,
        default: false
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

QuestionSchema.pre("save", function (next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

QuestionSchema.index({ author: 1, title: 1, tags: 1 });

export const Question = mongoose.model('Question', QuestionSchema);
