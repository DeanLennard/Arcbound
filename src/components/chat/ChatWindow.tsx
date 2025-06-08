// src/components/Chat/ChatWindow.tsx
import React, { useState, useEffect, useRef } from 'react';
import socket from '@/socket/socket';
import { formatTimestamp } from '@/lib/formatTimestamp';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface Chat {
    _id: string;
    isGroup: boolean;
    members: Array<{ _id: string; characterName: string; profileImage: string }>;
    groupName?: string;
    groupImage?: string;
}

interface Message {
    _id: string;
    content: string;
    senderId: { _id: string; characterName: string; profileImage: string };
    createdAt: string;
}

interface Props {
    chat: Chat;
    onClose: () => void;
    currentUserId: string;
}

export default function ChatWindow({ chat, onClose, currentUserId }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUserId, setTypingUserId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch chat history from the server
        fetch(`/api/chats/${chat._id}/messages`)
            .then((res) => res.json())
            .then((data) => setMessages(data.messages))
            .catch((err) => console.error('Failed to load messages:', err));

        // Setup Socket.IO
        socket.on('newMessage', handleNewMessage);

        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [chat._id]);

    useEffect(() => {
        socket.on('typing', ({ chatId, userId }) => {
            if (chatId === chat._id && userId !== currentUserId) {
                setIsTyping(true);
                setTypingUserId(userId);
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                    setTypingUserId(null);
                }, 2000);
            }
        });
        return () => {
            socket.off('typing');
        };
    }, [chat._id, currentUserId]);

    useEffect(() => {
        if (shouldAutoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, shouldAutoScroll]);

    useEffect(() => {
        fetch(`/api/chats/${chat._id}/read`, { method: 'POST' })
            .then(() => {
                // re-fetch chats to update unread counts in the sidebar
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('refreshChats'));
                }
            })
            .catch(err => console.error('Failed to mark messages as read:', err));
    }, [chat._id]);

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const res = await fetch(`/api/chats/${chat._id}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage.trim() })
            });
            const data = await res.json();
            socket.emit('sendMessage', data.message);

            window.dispatchEvent(new Event('refreshChats'));

            setNewMessage('');
            setShowEmojiPicker(false);
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const loadOlderMessages = async () => {
        if (!messagesContainerRef.current) return;

        const prevScrollHeight = messagesContainerRef.current.scrollHeight;
        setShouldAutoScroll(false);

        try {
            const oldestMessage = messages[0];
            const before = oldestMessage?.createdAt;
            const res = await fetch(`/api/chats/${chat._id}/messages?before=${before}`);
            const data = await res.json();

            // Filter out duplicates
            const newMessages = data.messages.filter(
                (msg) => !messages.find((existing) => existing._id === msg._id)
            );

            setMessages((prev) => [...newMessages, ...prev]);

            requestAnimationFrame(() => {
                const newScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
                messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
            });
        } catch (err) {
            console.error('Failed to load older messages:', err);
        }
    };

    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        if (messagesContainerRef.current.scrollTop === 0) {
            loadOlderMessages();
        }
    };

    const handleNewMessage = (message) => {
        if (message.chatId === chat._id) {
            setShouldAutoScroll(true);
            setMessages((prev) => [...prev, message]);

            window.dispatchEvent(new Event('refreshChats'));
        }
    };

    const handleEmojiSelect = (emoji: any) => {
        if (!emoji?.native) {
            console.error('Emoji native not found:', emoji);
            return;
        }
        setNewMessage((prev) => prev + emoji.native);
    };

    const handleTyping = () => {
        socket.emit('typing', { chatId: chat._id, userId: currentUserId });
    };

    return (
        <div className="bg-gray-800 p-2 flex flex-col h-100 w-full md:w-72 rounded shadow-lg overflow-x-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-700 mb-2">
                <h4 className="text-white text-md">
                    {chat.isGroup
                        ? chat.groupName
                        : chat.members.find((m) => m._id !== currentUserId)?.characterName || 'Chat'}
                </h4>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-red-500"
                >
                    X
                </button>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto mb-2 scrollbar-hide"
            >
            {messages.map((msg, index) => {
                    const isOwnMessage = msg.senderId._id === currentUserId;

                    return (
                        <div
                            key={msg._id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
                        >
                            {!isOwnMessage && (
                                <img
                                    src={msg.senderId.profileImage}
                                    alt={msg.senderId.characterName}
                                    className="w-6 h-6 object-cover rounded-full mr-2"
                                />
                            )}
                            <div
                                className={`max-w-xs p-2 rounded-lg ${
                                    isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
                                }`}
                            >
                                <div className="text-xs font-semibold mb-1">
                                    {msg.senderId.characterName}
                                </div>
                                <div className="text-sm whitespace-pre-wrap break-all">
                                    {msg.content}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {formatTimestamp(msg.createdAt)}
                                </div>
                            </div>
                            {isOwnMessage && (
                                <img
                                    src={msg.senderId.profileImage}
                                    alt={msg.senderId.characterName}
                                    className="w-6 h-6 object-cover rounded-full ml-2"
                                />
                            )}
                        </div>
                    );
                })}
                {/* This div acts as the scroll target */}
                {isTyping && (
                    <div className="text-xs text-gray-400">
                        {chat.members.find((m) => m._id === typingUserId)?.characterName || 'Someone'} is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="relative flex items-center gap-2 w-full">
                {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-50 origin-bottom-left scale-75 bg-gray-800 rounded-lg shadow-lg">
                        <Picker
                            data={data}
                            onEmojiSelect={handleEmojiSelect}
                            theme="dark"
                        />
                    </div>
                )}
                <div className="flex items-center gap-2 w-full overflow-hidden">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="flex-shrink-0"
                    >
                        😊
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        className="flex-1 min-w-0 p-1 rounded bg-gray-700 text-white"
                        placeholder="Type a message..."
                    />
                    <button
                        onClick={sendMessage}
                        className="flex-shrink-0 px-2 py-1 bg-blue-600 text-white rounded"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
