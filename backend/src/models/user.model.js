import mongoose from "mongoose";
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    uid: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    prefix:{
        type: String,
    },
    email: {
        type: String,        
    },
    phoneNumber:{
        type: String,
        required: true,
    },
    photoURL: {
        type: String,
    },
    interests:{
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

UserSchema.pre("save", function (next) {
    if (this.isModified()) {
        this.updatedAt = Date.now();
    }
    next();
});

UserSchema.index({ uid: 1, email: 1 });

export const User = mongoose.model("User", UserSchema);