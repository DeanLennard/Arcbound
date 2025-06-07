// src/models/Notification.ts
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    type: { type: String, enum: ['like', 'comment'], required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
