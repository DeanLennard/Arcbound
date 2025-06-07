// src/models/Post.ts
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    previewImage: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 👈 ensure ref is 'User'
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.models.Post || mongoose.model('Post', postSchema);
