// src/models/User.ts
import mongoose, { Document } from 'mongoose';

export interface UserDocument extends Document {
    email: string;
    password: string;
    role: string;
    playerName: string;
    characterName: string;
    profileImage: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // TODO: hash this
    role: { type: String, enum: ['admin', 'moderator', 'member', 'none'], default: 'member' },
    playerName: { type: String },
    characterName: { type: String },
    profileImage: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

}, {
    timestamps: true
});

export default mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
