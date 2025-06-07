// src/models/Comment.ts
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// ✅ Add this line to prevent OverwriteModelError
export default mongoose.models.Comment || mongoose.model('Comment', commentSchema);
