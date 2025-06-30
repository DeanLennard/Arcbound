// src/models/Message.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReaction {
    emoji: string
    users: Types.ObjectId[]
}

export interface IMessage extends Document {
    chatId: Types.ObjectId;
    senderId: Types.ObjectId;
    content: string;
    readBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    editedAt: Date;
    reactions: { emoji: string; users: Types.ObjectId[] }[];
}

const MessageSchema = new Schema<IMessage>({
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    editedAt: { type: Date },
    reactions: [{
        emoji: { type: String, required: true },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    }]
}, { timestamps: true });

MessageSchema.index({ chatId: 1, senderId: 1, readBy: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
