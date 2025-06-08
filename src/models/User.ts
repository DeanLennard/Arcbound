// src/models/User.ts
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // TODO: hash this
    role: { type: String, enum: ['admin', 'moderator', 'member', 'none'], default: 'member' },
    playerName: { type: String },
    characterName: { type: String },
    profileImage: { type: String } // Can be a URL or base64 or whatever you choose
}, {
    timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
