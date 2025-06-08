// src/components/Chat/ChatDock.tsx
'use client';

import React, { useEffect, useState } from 'react';
import ChatWindow from './ChatWindow';
import socket from '@/socket/socket';
import NewChatForm from './NewChatForm';
import { useSession } from 'next-auth/react';
import Image from "next/image";

interface Chat {
    _id: string;
    isGroup: boolean;
    members: Array<{ _id: string; characterName: string; profileImage: string }>;
    groupName?: string;
    groupImage?: string;
}

export default function ChatDock() {
    const { data: session, status } = useSession();

    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChats, setActiveChats] = useState<Chat[]>([]);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [isMinimised, setIsMinimised] = useState(false);

    const currentUserId = session?.user?.id || '';
    const userRole = session?.user?.role || '';
    const totalUnreadCount = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

    // Fetch chats (for example, from your API)
    useEffect(() => {
        if (!session) return;

        const fetchChats = () => {
            fetch('/api/chats')
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        console.error('API Error:', data.error);
                        setChats([]);
                        return;
                    }

                    if (!data.chats || !Array.isArray(data.chats)) {
                        console.error('Unexpected chat data:', data);
                        setChats([]);
                        return;
                    }

                    data.chats.sort((a, b) => {
                        const aTime = new Date(a.lastMessageAt || a.createdAt).getTime();
                        const bTime = new Date(b.lastMessageAt || b.createdAt).getTime();
                        return bTime - aTime;
                    });

                    setChats(data.chats);

                    // Join all chat rooms
                    data.chats.forEach((chat) => {
                        socket.emit('joinChat', chat._id);
                    });
                })
                .catch(err => console.error('Failed to load chats:', err));
        };

        // Fetch initially
        fetchChats();

        // Listen for the custom 'refreshChats' event
        const handleRefresh = () => fetchChats();
        window.addEventListener('refreshChats', handleRefresh);

        // Listen for real-time new messages via Socket.IO
        const handleNewMessage = () => {
            fetchChats();

            // Play sound
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(err => {
                console.warn('Notification sound failed to play:', err);
            });
        };
        socket.on('newMessage', handleNewMessage);

        return () => {
            window.removeEventListener('refreshChats', handleRefresh);
            socket.off('newMessage', handleNewMessage);
        };
    }, [session]);

    const openChat = (chat: Chat) => {
        if (!activeChats.find(c => c._id === chat._id)) {
            setActiveChats(prev => [...prev, chat]);
        }
    };

    const closeChat = (chatId: string) => {
        setActiveChats(prev => prev.filter(c => c._id !== chatId));
    };

    return (
        <>
            {/* Loading state */}
            {status === 'loading' && (
                <div className="fixed bottom-4 right-4 bg-gray-800 text-white rounded shadow-lg w-64 p-2">
                    <h3 className="font-bold mb-2">Loading chat...</h3>
                </div>
            )}
            {/* Hide chat if not authenticated */}
            {status !== 'loading' && session && userRole !== 'none' && (
                <>
                    {showNewChatModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-gray-800 text-white p-4 rounded w-[36rem] overflow-y-auto">
                                <h2 className="text-lg font-bold mb-2">Start New Chat</h2>
                                <button
                                    onClick={() => setShowNewChatModal(false)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                >
                                    X
                                </button>
                                <NewChatForm
                                    onClose={() => setShowNewChatModal(false)}
                                    onChatCreated={(newChat) => {
                                        setChats((prev) => [...prev, newChat]);
                                        setActiveChats((prev) => [...prev, newChat]);
                                        setShowNewChatModal(false);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    {/* Minimized Chat Dock */}
                    {isMinimised && (
                        <div className="fixed bottom-4 right-4 z-50">
                            <button
                                onClick={() => setIsMinimised(false)}
                                className="relative bg-gray-800 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                                aria-label="Open chat dock"
                            >
                                💬
                                {totalUnreadCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-xs text-white rounded-full px-2">
                                        {totalUnreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                    {/* Chat Sidebar */}
                    {!isMinimised && (
                        <div className="fixed bottom-4 right-4 bg-gray-800 text-white rounded shadow-lg w-64 p-2">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold mb-2">Chats</h3>
                                <button
                                    onClick={() => setIsMinimised(true)}
                                    className="text-gray-400 hover:text-red-500"
                                    aria-label="Minimize chat dock"
                                >
                                    −
                                </button>
                            </div>
                            <button
                                onClick={() => setShowNewChatModal(true)}
                                className="bg-green-600 text-white px-2 py-1 rounded w-full mb-2"
                            >
                                + New Chat
                            </button>
                            <div className="max-h-64 overflow-y-auto">
                                {chats.map((chat) => {
                                    const chatName = chat.isGroup
                                        ? chat.groupName
                                        : chat.members.find(m => m._id !== currentUserId)?.characterName || 'Unknown';
                                    const chatImage = chat.isGroup
                                        ? chat.groupImage
                                        : chat.members.find(m => m._id !== currentUserId)?.profileImage || '';

                                    return (
                                        <div
                                            key={chat._id}
                                            onClick={() => openChat(chat)}
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
                                            <span>{chatName}</span>
                                            {chat.unreadCount > 0 && (
                                                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2">
                                                    {chat.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Active Chat Windows */}
                    <div
                        className="fixed bottom-4 left-4 right-4
                            md:left-auto md:right-72
                            w-auto md:w-72
                            z-50
                            flex justify-center md:justify-end
                            gap-x-2"
                    >
                        {activeChats.map((chat, idx) => (
                            <div key={chat._id} className="relative">
                                <ChatWindow
                                    key={chat._id}
                                    chat={chat}
                                    onClose={() => closeChat(chat._id)}
                                    currentUserId={currentUserId}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
