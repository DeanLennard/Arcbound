// src/components/Chat/ChatDock.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import ChatWindow from './ChatWindow';
import socket from '@/socket/socket';
import NewChatForm from './NewChatForm';
import { useSession } from 'next-auth/react';
import Image from "next/image";
import type { FrontendChat } from '@/types/chat';

type RawMember = {
    _id: string | { toString(): string };
    characterName?: string;
    profileImage?: string;
};

type RawChat = {
    _id: string | { toString(): string };
    groupName?: string;
    groupImage?: string;
    isGroup?: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    unreadCount?: number | string;
    members?: RawMember[];
};

export default function ChatDock() {
    const { data: session, status } = useSession();

    const [chats, setChats] = useState<FrontendChat[]>([]);
    const [activeChats, setActiveChats] = useState<FrontendChat[]>([]);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [isMinimised, setIsMinimised] = useState(false);
    const [mutedChats, setMutedChats] = useState<Set<string>>(new Set())
    const mutedChatsRef = useRef<Set<string>>(mutedChats);

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

    // keep the ref up to date
    useEffect(() => {
        mutedChatsRef.current = mutedChats;
    }, [mutedChats]);

    // 1) Load muted‐chats once
    useEffect(() => {
        fetch('/api/users/muted-chats')
            .then(r => r.json())
            .then(data => setMutedChats(new Set(data.chatIds)))
            .catch(console.error);
    }, []);

    // listen for ChatWindow toggles
    useEffect(() => {
        const onMuteToggled = (e: Event) => {
            const { chatId, muted } = (e as CustomEvent<{ chatId: string; muted: boolean }>).detail;
            setMutedChats(prev => {
                const next = new Set(prev);
                if (muted) {
                    next.add(chatId);
                } else {
                    next.delete(chatId);
                }
                return next;
            });
        };
        window.addEventListener('chatMuteToggled', onMuteToggled);
        return () => {
            window.removeEventListener('chatMuteToggled', onMuteToggled);
        };
    }, []);

    // socket listener—only once on mount
    useEffect(() => {
        const onNewMessage = (message: { chatId: unknown }) => {
            const raw = message.chatId;
            const chatId = String(raw);
            //console.log('incoming chatId:', chatId);
            //console.log('mutedChats:', Array.from(mutedChatsRef.current));

            if (!mutedChatsRef.current.has(chatId)) {
                //console.log('→ playing sound');
                new Audio('/sounds/notification.mp3').play().catch(() => {});
            } else {
                //console.log('→ skipping sound (muted)');
            }

            window.dispatchEvent(new Event('refreshChats'));
        };
        socket.on('newMessage', onNewMessage);
        return () => {
            socket.off('newMessage', onNewMessage);
        };
    }, []);

    const sanitiseChat = (chat: RawChat): FrontendChat => {
        const created = typeof chat.createdAt === "string"
            ? chat.createdAt
            : chat.createdAt.toISOString();

        const updated = typeof chat.updatedAt === "string"
            ? chat.updatedAt
            : chat.updatedAt.toISOString();

        return {
            _id: chat._id.toString(),
            groupName: chat.groupName ?? null,
            groupImage: chat.groupImage ?? null,
            isGroup: Boolean(chat.isGroup),

            createdAt: created,
            updatedAt: updated,

            unreadCount:
                typeof chat.unreadCount === "number"
                    ? chat.unreadCount
                    : chat.unreadCount === "5+"
                        ? "5+"
                        : 0,

            members: (chat.members ?? []).map(m => ({
                _id: m._id.toString(),
                characterName: m.characterName ?? "",
                profileImage: m.profileImage ?? "/placeholder.jpg",
            }))
        };
    };

    // 3) Fetch chats + setup refresh & socket once
    useEffect(() => {
        if (!session || session.user.role === 'none') return;

        const fetchChats = () => {
            fetch('/api/chats')
                .then(r => r.json())
                .then(data => {
                    if (!Array.isArray(data.chats)) {
                        console.error('Bad /api/chats response', data);
                        return setChats([]);
                    }
                    const sorted: RawChat[] = data.chats;
                    const safe = sorted.map(sanitiseChat);
                    setChats(safe);

                    // join socket rooms
                    safe.forEach(c => socket.emit("joinChat", c._id));
                })
                .catch(console.error);
        };

        fetchChats();
        window.addEventListener('refreshChats', fetchChats);
        return () => {
            window.removeEventListener('refreshChats', fetchChats);
        };
    }, [session, status]);

    const openChat = (chat: FrontendChat) => {
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
                                        const safe = sanitiseChat(newChat as RawChat);

                                        setChats(prev => {
                                            const exists = prev.find(chat => chat._id === safe._id);
                                            if (exists) return prev;
                                            return [...prev, safe];
                                        });

                                        setActiveChats(prev => {
                                            const exists = prev.find(chat => chat._id === safe._id);
                                            if (exists) return prev;
                                            return [...prev, safe];
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
                                    className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-700 focus:outline-none focus:ring"
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
                                    // figure out whether we should treat this as a group chat
                                    const isActuallyGroup =
                                        !!chat.groupName?.trim() ||
                                        chat.isGroup ||
                                        (chat.members?.length || 0) > 2;

                                    // find the “other” person in a true 1:1 chat
                                    const otherMember = chat.members?.find(
                                        (m) =>
                                            m?._id &&
                                            m._id.toString() !== currentUserId
                                    );

                                    // pick the display name
                                    const chatName = chat.groupName?.trim()
                                        ? chat.groupName
                                        : !isActuallyGroup
                                            ? otherMember?.characterName ?? 'Chat'
                                            : 'Group Chat';

                                    const chatImage = chat.groupImage?.trim()
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
                                    chat={chat}
                                    onClose={() => closeChat(chat._id.toString())}
                                    currentUserId={currentUserId}
                                    onChatUpdated={(updated) => {
                                        // update in activeChats
                                        setActiveChats(prev =>
                                            prev.map(c => c._id === updated._id ? updated : c)
                                        );

                                        // update in main chat list
                                        setChats(prev =>
                                            prev.map(c => c._id === updated._id ? updated : c)
                                        );
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
