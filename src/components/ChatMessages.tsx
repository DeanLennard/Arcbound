// src/components/ChatMessages.tsx
"use client";
import React, {useState, useEffect, useRef, useCallback} from "react";
import Image from "next/image";

interface Props {
    chat: {
        _id: string;
        members: { _id: string; characterName: string; profileImage?: string }[];
    };
}

interface Message {
    _id: string;
    content: string;
    senderId: { _id: string; characterName: string; profileImage?: string };
    createdAt: string;
}

export default function ChatMessages({ chat }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const loadMessages = useCallback(async (before?: string) => {
        setLoading(true);
        const url = `/api/chats/${chat._id}/messages?limit=20${before ? `&before=${before}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        setMessages(prev => {
            const allMessages = [...data.messages, ...prev];
            const uniqueMessages = allMessages.filter(
                (msg, index, self) => index === self.findIndex(m => m._id === msg._id)
            );
            uniqueMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return uniqueMessages;
        });
        setHasMore(data.messages.length > 0);
        setLoading(false);
    }, [chat._id]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        if (containerRef.current.scrollTop === 0 && hasMore && !loading) {
            const oldest = messages[0];
            if (oldest) {
                loadMessages(oldest.createdAt);
            }
        }
    };

    const isImageUrl = (content: string) =>
        /^\/uploads\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(content);

    const isFileUrl = (content: string) =>
        /^\/uploads\/.+\.(pdf|docx?|xlsx?|zip|rar|txt|csv)$/i.test(content);

    const isLinkUrl = (content: string) =>
        /^https?:\/\/[^\s]+$/i.test(content);

    return (
        <div className="p-4 max-h-[70vh] overflow-y-auto bg-gray-800 rounded" onScroll={handleScroll} ref={containerRef}>
            {messages.map(msg => (
                <div key={msg._id} className="mb-2">
                    <div className="flex items-center gap-2">
                        {msg.senderId.profileImage && (
                            <Image
                                src={msg.senderId.profileImage}
                                alt={msg.senderId.characterName}
                                width={24}
                                height={24}
                                className="rounded-full"
                            />
                        )}
                        <span className="font-bold">{msg.senderId.characterName}</span>
                        <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="ml-8 break-words break-all">
                        {isImageUrl(msg.content) ? (
                            <Image
                                src={msg.content}
                                alt="uploaded image"
                                width={200}
                                height={200}
                                unoptimized
                                className="rounded"
                            />
                        ) : isFileUrl(msg.content) ? (
                            <a
                                href={msg.content}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline"
                            >
                                📎 Download File
                            </a>
                        ) : isLinkUrl(msg.content) ? (
                            <a
                                href={msg.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline"
                            >
                                {msg.content}
                            </a>
                        ) : (
                            msg.content
                        )}
                    </p>
                </div>
            ))}
            {loading && <p>Loading messages...</p>}
        </div>
    );
}
