// src/models/Chat.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
    isGroup: boolean;
    members: string[]; // array of user IDs
    groupName?: string;
    groupImage?: string;
    createdAt: Date;
}

const ChatSchema = new Schema<IChat>(
    {
        isGroup: { type: Boolean, default: false },
        members: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
        groupName: { type: String },
        groupImage: { type: String }
    },
    { timestamps: true }  // This automatically adds createdAt and updatedAt
);

ChatSchema.index({ members: 1 });

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
