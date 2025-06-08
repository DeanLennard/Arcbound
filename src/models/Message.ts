// src/models/Message.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    chatId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    readBy: string;
}

const MessageSchema = new Schema<IMessage>({
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
