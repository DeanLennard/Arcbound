// src/components/Chat/ChatDock.tsx
'use client';

import React, { useEffect, useState } from 'react';
import ChatWindow from './ChatWindow';
import socket from '@/socket/socket';
import NewChatForm from './NewChatForm';
import { useSession } from 'next-auth/react';
import Image from "next/image";
import type { Chat } from '@/types/chat';

export default function ChatDock() {
    const { data: session, status } = useSession();

    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChats, setActiveChats] = useState<Chat[]>([]);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [isMinimised, setIsMinimised] = useState(false);
    const [mutedChats, setMutedChats] = useState<Set<string>>(new Set())

    const currentUserId = session?.user?.id || '';
    const userRole = session?.user?.role || '';

    const totalUnreadCount = chats.reduce((sum, chat) => {
        if (typeof chat.unreadCount === 'number') {
            return sum + chat.unreadCount;
        } else if (chat.unreadCount === '5+') {
            return sum + 5;
        }
        return sum;
    }, 0);

    // 1) Load muted‐chats once
    useEffect(() => {
        fetch('/api/users/muted-chats')
            .then(r => r.json())
            .then(data => setMutedChats(new Set(data.chatIds)))
            .catch(console.error);
    }, []);

    // 2) Listen for per-chat mute toggles
    useEffect(() => {
        const onMuteToggled: EventListener = (e) => {
            const custom = e as CustomEvent<{ chatId: string; muted: boolean }>;
            setMutedChats(prev => {
                const next = new Set(prev);
                if (custom.detail.muted) next.add(custom.detail.chatId);
                else                   next.delete(custom.detail.chatId);
                return next;
            });
        };

        window.addEventListener('chatMuteToggled', onMuteToggled);
        return () => {
            window.removeEventListener('chatMuteToggled', onMuteToggled);
        };
    }, []);

    // 3) Fetch chats + setup refresh & socket once
    useEffect(() => {
        if (!session || userRole === 'none') return;

        // A) fetcher
        const fetchChats = () => {
            fetch('/api/chats')
                .then(r => r.json())
                .then(data => {
                    if (!Array.isArray(data.chats)) {
                        console.error('Bad /api/chats response', data);
                        setChats([]);
                        return;
                    }

                    // use a local array so we don't refer to `chats` state here
                    const newChats = [...data.chats] as Chat[];
                    newChats.sort((a, b) =>
                        new Date(b.updatedAt || b.createdAt).getTime() -
                        new Date(a.updatedAt || a.createdAt).getTime()
                    );
                    setChats(newChats);
                    newChats.forEach(c => socket.emit('joinChat', c._id));
                })
                .catch(console.error);
        };
        fetchChats();

        // B) refreshChats listener
        const handleRefresh = () => fetchChats();
        window.addEventListener('refreshChats', handleRefresh);

        // C) newMessage socket listener
        const playSoundIfUnmuted = (chatId: string) => {
            if (mutedChats.has(chatId)) return;
            new Audio('/sounds/notification.mp3').play().catch(() => {});
        };
        const onNewMessage = (message: { chatId: string }) => {
            fetchChats();
            playSoundIfUnmuted(message.chatId);
        };
        socket.on('newMessage', onNewMessage);

        // teardown
        return () => {
            window.removeEventListener('refreshChats', handleRefresh);
            socket.off('newMessage', onNewMessage);
        };
    }, [session, userRole, mutedChats]);

    const openChat = (chat: Chat) => {
        if (!activeChats.find(c => c._id === chat._id)) {
            setActiveChats(prev => [...prev, chat]);
        }
    };

    const closeChat = (chatId: string) => {
        setActiveChats(prev => prev.filter(c => c._id.toString() !== chatId));
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
                                        setChats((prev) => {
                                            const exists = prev.find(chat => chat._id.toString() === newChat._id.toString());
                                            if (exists) return prev; // Don’t duplicate
                                            return [...prev, newChat];
                                        });

                                        setActiveChats((prev) => {
                                            const exists = prev.find(chat => chat._id.toString() === newChat._id.toString());
                                            if (exists) return prev;
                                            return [...prev, newChat];
                                        });

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
                                    const otherMember = chat.members?.find(m => m?._id && m._id.toString() !== currentUserId);

                                    const chatName = chat.isGroup
                                        ? chat.groupName ?? 'Unknown'
                                        : otherMember?.characterName ?? 'Unknown';

                                    const chatImage = chat.isGroup
                                        ? (chat.groupImage && chat.groupImage.startsWith('/uploads')
                                            ? chat.groupImage
                                            : '/placeholder.jpg')
                                        : (otherMember?.profileImage ?? '/placeholder.jpg');

                                    return (
                                        <div
                                            key={chat._id.toString()}
                                            onClick={() => openChat(chat)}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-2 rounded"
                                        >
                                            {chatImage && (
                                                <div style={{ position: 'relative', width: '20%', aspectRatio: '1 / 1', borderRadius: '50%', overflow: 'hidden' }}>
                                                    <Image
                                                        src={chatImage}
                                                        alt={chatName}
                                                        fill
                                                        unoptimized
                                                        style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    />
                                                </div>
                                            )}
                                            <span>{chatName.length > 40 ? `${chatName.substring(0, 40)}...` : chatName}</span>
                                            {(typeof chat.unreadCount === 'number' && chat.unreadCount > 0) ||
                                            (chat.unreadCount === '5+') ? (
                                                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2">
                                                    {chat.unreadCount}
                                                </span>
                                            ) : null}
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
                        {activeChats.map((chat) => (
                            <div key={chat._id.toString()} className="relative">
                                <ChatWindow
                                    key={chat._id.toString()}
                                    chat={chat}
                                    onClose={() => closeChat(chat._id.toString())}
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
