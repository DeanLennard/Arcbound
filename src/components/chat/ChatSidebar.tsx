// src/components/Chat/ChatSidebar.tsx
import React from 'react';
import Image from "next/image";

interface Chat {
    _id: string;
    isGroup: boolean;
    members: Array<{ _id: string; characterName: string; profileImage: string }>;
    groupName?: string;
    groupImage?: string;
}

interface Props {
    chats: Chat[];
    setActiveChat: (chat: Chat) => void;
}

export default function ChatSidebar({ chats, setActiveChat }: Props) {
    return (
        <div className="p-2">
            <h3 className="text-white text-lg mb-2">Chats</h3>
            {chats.map((chat) => {
                const chatName = chat.isGroup
                    ? chat.groupName
                    : chat.members.find(m => m._id !== 'ME')?.characterName || 'Unknown';
                const chatImage = chat.isGroup
                    ? chat.groupImage
                    : chat.members.find(m => m._id !== 'ME')?.profileImage || '';

                return (
                    <div
                        key={chat._id}
                        onClick={() => setActiveChat(chat)}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-2 rounded"
                    >
                        {chatImage && (
                            <div style={{ position: 'relative', width: '20%', aspectRatio: '1 / 1', borderRadius: '50%', overflow: 'hidden' }}>
                                <Image
                                    src={chatImage}
                                    alt={chatName}
                                    fill
                                    style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                        )}
                        <span className="text-white">{chatName}</span>
                    </div>
                );
            })}
        </div>
    );
}
