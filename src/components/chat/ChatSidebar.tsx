// src/components/Chat/ChatSidebar.tsx
import React from 'react';
import Image from "next/image";
import type { Chat } from '@/types/chat';
import { useSession } from 'next-auth/react';

interface Props {
    chats: Chat[];
    setActiveChat: (chat: Chat) => void;
}

export default function ChatSidebar({ chats, setActiveChat }: Props) {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id || '';

    return (
        <div className="p-2">
            <h3 className="text-white text-lg mb-2">Chats</h3>
            {chats.map((chat) => {
                const chatName = chat.isGroup
                    ? chat.groupName ?? 'Unknown'
                    : chat.members.find(m => m._id.toString() !== currentUserId)?.characterName ?? 'Unknown';

                const chatImage = chat.isGroup
                    ? chat.groupImage ?? ''
                    : chat.members.find(m => m._id.toString() !== currentUserId)?.profileImage ?? '';

                return (
                    <div
                        key={chat._id.toString()}
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
