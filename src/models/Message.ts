// src/models/Message.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
    chatId: Types.ObjectId;
    senderId: Types.ObjectId;
    content: string;
    createdAt: Date;
    readBy: Types.ObjectId[];
}

const MessageSchema = new Schema<IMessage>({
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

MessageSchema.index({ chatId: 1, senderId: 1, readBy: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
