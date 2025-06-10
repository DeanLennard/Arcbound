// src/app/(dashboard)/admin/chats/page.tsx
"use client";
import React, {useState, useEffect, useRef, useCallback} from "react";
import Image from "next/image";
import Modal from "@/components/Modal";
import ChatMessages from "@/components/ChatMessages";

interface Chat {
    _id: string;
    isGroup: boolean;
    members: Array<{ _id: string; characterName: string; profileImage: string }>; // change ObjectId -> string
    groupName?: string;
    groupImage?: string;
    createdAt: Date;
    updatedAt?: Date;
    lastMessageAt?: Date;
}

export default function ChatsPage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef<HTMLDivElement | null>(null);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    const loadChats = useCallback(async () => {
        const res = await fetch(`/api/chats?all=true&page=${page}`);
        const data = await res.json();
        setChats(prev => {
            const allChats = [...prev, ...data.chats];
            const uniqueChats = allChats.filter(
                (chat, index, self) =>
                    index === self.findIndex((c) => c._id === chat._id)
            );
            uniqueChats.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt).getTime();
                return dateB - dateA;
            });
            return uniqueChats;
        });
        setHasMore(data.chats.length > 0);
    }, [page]);

    useEffect(() => {
        loadChats();
    }, [loadChats]);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }
        return () => observer.disconnect();
    }, [hasMore]);

    return (
        <div className="max-w-5xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Manage Chats</h1>
            <div className="grid grid-cols-1 gap-4">
                {chats.map(chat => (
                    <div
                        key={chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className="p-4 border rounded cursor-pointer hover:bg-gray-700"
                    >
                        <div className="flex items-center gap-2">
                            {chat.groupImage && (
                                <Image
                                    src={chat.groupImage}
                                    alt={chat.groupName || "Group"}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                />
                            )}
                            <div>
                                <p className="font-bold">
                                    {chat.isGroup
                                        ? chat.groupName
                                        : chat.members.map(m => m.characterName).join(", ")}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {new Date(chat.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {hasMore && <div ref={loaderRef} className="text-center p-4">Loading more chats...</div>}

            {selectedChat && (
                <Modal onClose={() => setSelectedChat(null)}>
                    <ChatMessages chat={selectedChat} />
                </Modal>
            )}
        </div>
    );
}
