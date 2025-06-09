// src/models/Post.ts
import mongoose, { Document } from 'mongoose';

export interface PostDocument extends Document {
    title: string;
    content: string;
    previewImage: string;
    category: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    likes: mongoose.Types.ObjectId[];
    views: number;
    subscribers: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new mongoose.Schema<PostDocument>({
    title: String,
    content: String,
    previewImage: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.models.Post || mongoose.model<PostDocument>('Post', postSchema);
