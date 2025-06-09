// src/types/chat.ts
import { Types } from 'mongoose';

export interface Chat {
    _id: Types.ObjectId;
    isGroup: boolean;
    members: Array<{ _id: Types.ObjectId; characterName: string; profileImage: string }>;
    groupName?: string;
    groupImage?: string;
    createdAt: Date;
    updatedAt?: Date;
    lastMessageAt?: Date;
    unreadCount?: number;
}
