// src/types/chat.ts

// What the frontend actually receives after sanitisation
export interface ChatMember {
    _id: string; // always serialised to string
    characterName: string;
    profileImage: string;
}

export interface Chat {
    _id: string;
    isGroup: boolean;
    members: ChatMember[];

    groupName: string | null;
    groupImage?: string | null;

    createdAt: string;     // ISO date string
    updatedAt: string;     // ISO date string
    lastMessageAt?: string;

    unreadCount: number | "5+";
}

export interface FrontendChat {
    _id: string;
    isGroup: boolean;
    members: Array<{ _id: string; characterName: string; profileImage: string }>;
    groupName: string | null;
    groupImage: string | null;
    createdAt: string;
    updatedAt: string;
    unreadCount: number | "5+";
}
