// src/components/Chat/ChatWindow.tsx
import React, {useState, useEffect, useRef, useCallback} from 'react';
import socket from '@/socket/socket';
import { formatTimestamp } from '@/lib/formatTimestamp';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import Image from "next/image";
import type { Chat } from '@/types/chat';
import Select from 'react-select';
import Linkify from 'linkify-react';

interface User {
    _id: string;
    characterName: string;
    profileImage?: string;
}

interface Message {
    _id: string;
    chatId: string;
    content: string;
    senderId: { _id: string; characterName: string; profileImage: string };
    createdAt: string;
}

interface Props {
    chat: Chat;
    onClose: () => void;
    currentUserId: string;
}

interface Emoji {
    native: string;
}

interface TenorGifResult {
    media_formats: {
        gif: {
            url: string;
        };
    };
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
    const [showGroupMembers, setShowGroupMembers] = useState(false);
    const [editedGroupName, setEditedGroupName] = useState(chat.groupName || '');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isMaximised, setIsMaximised] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifResults, setGifResults] = useState<string[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetch(`/api/chats/${chat._id}/messages`)
            .then((res) => res.json())
            .then((data) => setMessages(data.messages))
            .catch((err) => console.error('Failed to load messages:', err));
    }, [chat._id]);

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => setUsers(data.users))
            .catch(err => console.error('Failed to load users:', err));
    }, []);

    useEffect(() => {
        fetch(`/api/chats/${chat._id}/is-muted`)
            .then(res => res.json())
            .then(data => setIsMuted(data.muted))
            .catch(console.error);
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
        if (isSending) return;
        if (!newMessage.trim()) return;

        setIsSending(true);
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
        } finally {
            setIsSending(false);
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
                (msg: Message) => !messages.find((existing) => existing._id === msg._id)
            );

            setMessages((prev) => [...newMessages, ...prev]);

            requestAnimationFrame(() => {
                const newScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
                }
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

    const handleNewMessage = useCallback((message: Message) => {
        if (message.chatId === chat._id.toString()) {
            setShouldAutoScroll(true);
            setMessages((prev) => [...prev, message]);
            window.dispatchEvent(new Event('refreshChats'));
        }
    }, [chat._id]);

    useEffect(() => {
        socket.on('newMessage', handleNewMessage);
        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [handleNewMessage]);

    const handleEmojiSelect = (emoji: Emoji) => {
        if (!emoji?.native) {
            console.error('Emoji native not found:', emoji);
            return;
        }
        setNewMessage((prev) => prev + emoji.native);
    };

    const handleTyping = () => {
        socket.emit('typing', { chatId: chat._id, userId: currentUserId });
    };

    const handleLeaveGroup = async () => {
        try {
            const res = await fetch(`/api/chats/${chat._id}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                window.dispatchEvent(new Event('refreshChats'));
                onClose();
            } else {
                const data = await res.json();
                alert(`Failed to leave group: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Failed to leave group:', err);
            alert('Failed to leave group.');
        }
    };

    const toggleMute = async () => {
        try {
            const res = await fetch(`/api/chats/${chat._id}/toggle-mute`, { method: 'POST' });
            const data = await res.json();
            setIsMuted(data.muted);
            window.dispatchEvent(new CustomEvent('chatMuteToggled', {
                detail: { chatId: chat._id, muted: data.muted }
            }))
        } catch (err) {
            console.error('Failed to toggle mute', err);
        }
    };

    const sendMessageWithImage = async (imageUrl: string) => {
        try {
            const res = await fetch(`/api/chats/${chat._id}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: imageUrl })
            });
            const data = await res.json();
            socket.emit('sendMessage', data.message);
            window.dispatchEvent(new Event('refreshChats'));
        } catch (err) {
            console.error('Failed to send image message:', err);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.url) {
                await sendMessageWithImage(data.url);
            }
        } catch (error) {
            console.error('Failed to upload image:', error);
        } finally {
            // Reset the file input so selecting the same file again triggers onChange
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const isImageUrl = (content: string) => {
        return (
            /^\/uploads\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(content) ||
            /^https:\/\/media\.tenor\.com\/.+\.(gif|mp4|webm)$/i.test(content)
        );
    };

    const isFileUrl = (content: string) =>
        /^\/uploads\/.+\.(pdf|docx?|xlsx?|zip|rar|txt|csv)$/i.test(content);

    const isLinkUrl = (content: string) =>
        /^https?:\/\/[^\s]+$/i.test(content);

    const searchGifs = async (query: string) => {
        if (!query.trim()) {
            setGifResults([]);
            return;
        }
        try {
            const res = await fetch(
                `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
                    query
                )}&key=AIzaSyAkjSCNs3caE0jdKUWFnmgIPTbHXYphj80&limit=10`
            );
            const data = await res.json();
            setGifResults(
                data.results.map((gif: TenorGifResult) => gif.media_formats.gif.url)
            );
        } catch (err) {
            console.error("Failed to fetch GIFs:", err);
        }
    };

    return (
        <div
            className={`bg-gray-800 p-2 flex flex-col rounded shadow-lg overflow-x-hidden ${
                isMaximised
                    ? 'fixed inset-4 z-50 w-auto h-auto max-h-[90vh]'
                    : 'h-100 w-full md:w-72'
            }`}
        >
        {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-700 mb-2">
                <h4 className="text-white text-md">
                    {chat.groupName?.trim()
                        ? chat.groupName
                        : chat.isGroup
                            ? 'Group Chat'
                            : chat.members.find(m => {
                                if (!m || !m._id) return false
                                const idString = typeof m._id === 'string'
                                    ? m._id
                                    : m._id.toString()
                                return idString !== currentUserId
                            })?.characterName
                            || 'Chat'}
                </h4>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute Chat' : 'Mute Chat'}
                        className="p-2 rounded-md text-gray-400 hover:text-yellow-400 hover:bg-gray-700 focus:outline-none focus:ring"
                    >
                        {isMuted ? '🔕' : '🔔'}
                    </button>
                    <button
                        onClick={() => setIsMaximised(!isMaximised)}
                        className="p-2 rounded-md text-gray-400 hover:text-green-500 hover:bg-gray-700 focus:outline-none focus:ring"
                    >
                        {isMaximised ? '−' : '⬈'}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-700 focus:outline-none focus:ring"
                    >
                        X
                    </button>
                </div>
            </div>
            <button
                onClick={() => setShowGroupMembers(true)}
                className="text-gray-400 hover:text-white text-xs underline"
            >
                Group Settings
            </button>
            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto mb-2 scrollbar-hide"
            >
            {messages.map((msg) => {
                const isOwnMessage = msg.senderId._id === currentUserId;
                    return (
                        <div
                            key={msg._id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
                        >
                            {!isOwnMessage && (
                                <Image
                                    src={msg.senderId.profileImage}
                                    alt={msg.senderId.characterName}
                                    width={24}
                                    height={24}
                                    unoptimized
                                    className="w-6 h-6 object-cover rounded-full mr-2"
                                />
                            )}
                            <div
                                className={`p-2 rounded-lg 
                                    ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}
                                    ${isMaximised ? 'max-w-6xl' : 'max-w-xs'}
                                `}
                            >
                                <div
                                    className={`font-semibold mb-1 break-words break-all ${isMaximised ? 'text-sm' : 'text-xs'}`}
                                >
                                    {msg.senderId.characterName}
                                </div>
                                <div
                                    className={`whitespace-pre-wrap break-smart ${isMaximised ? 'text-lg' : 'text-sm'}`}
                                >
                                    {isImageUrl(msg.content) ? (
                                        <Image
                                            src={msg.content}
                                            alt="uploaded image"
                                            width={200}
                                            height={200}
                                            unoptimized
                                            className="rounded cursor-pointer"
                                            onClick={() => window.handleImageClick(msg.content)}
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
                                        <Linkify
                                            options={{
                                                target: '_blank',
                                                rel: 'noopener',
                                                className: 'text-blue-400 underline'
                                            }}
                                        >
                                            {msg.content}
                                        </Linkify>
                                    )}
                                </div>
                                <div
                                    className={`text-gray-400 mt-1 ${isMaximised ? 'text-sm' : 'text-xs'}`}
                                >
                                    {formatTimestamp(msg.createdAt)}
                                </div>
                            </div>
                            {isOwnMessage && (
                                <Image
                                    src={msg.senderId.profileImage}
                                    alt={msg.senderId.characterName}
                                    width={24}
                                    height={24}
                                    unoptimized
                                    className="w-6 h-6 object-cover rounded-full mr-2"
                                />
                            )}
                        </div>
                    );
                })}
                {/* This div acts as the scroll target */}
                {(() => {
                    const typingUser = chat.members.find((m) => {
                        if (!m || !m._id) return false;
                        const idString = typeof m._id === 'string' ? m._id : m._id.toString();
                        return idString === typingUserId;
                    });
                    const typingName = typingUser?.characterName || 'Someone';
                    return (
                        isTyping && (
                            <div className="text-xs text-gray-400">
                                {typingName} is typing...
                            </div>
                        )
                    );
                })()}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex flex-col gap-2 w-full">
                <div className="relative w-full">
                    {showGifPicker && (
                        <div
                            className="absolute bottom-full left-0 mb-2 z-50 p-2 bg-gray-800 rounded-lg shadow-lg w-64 max-w-full"
                        >
                            <input
                                type="text"
                                placeholder="Search GIFs..."
                                onChange={(e) => searchGifs(e.target.value)}
                                className="p-2 rounded bg-gray-700 text-white mb-2 w-full"
                            />
                            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                                {gifResults.map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt="GIF"
                                        className="rounded cursor-pointer"
                                        onClick={() => {
                                            sendMessageWithImage(url);
                                            setShowGifPicker(false);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {showEmojiPicker && (
                        <div
                            className="absolute bottom-full left-0 mb-2 z-50 origin-bottom-left scale-75 bg-gray-800 rounded-lg shadow-lg">
                            <Picker
                                data={data}
                                onEmojiSelect={handleEmojiSelect}
                                theme="dark"
                            />
                        </div>
                    )}
                    {/* Action Buttons in one row */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="flex-shrink-0"
                        >
                            😊
                        </button>
                        <button
                            onClick={() => setShowGifPicker(!showGifPicker)}
                            className="flex-shrink-0"
                        >
                            🎞️
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-shrink-0"
                        >
                            📷
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            ref={fileInputRef}
                        />
                    </div>
                    {/* Textarea and Send */}
                    <div className="flex items-center gap-2">
                        <textarea
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
                            rows={1}
                            className="flex-1 p-1 rounded bg-gray-700 text-white resize-y min-h-8 max-h-48"
                            placeholder="Type a message..."
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isSending}
                            className="px-2 py-1 bg-blue-600 text-white rounded"
                        >
                            {isSending ? 'Sending…' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
            {showGroupMembers && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 text-white p-4 rounded w-80">
                        <h2 className="text-lg font-bold mb-2">Group Settings</h2>

                        {/* Group Name */}
                        <label className="block mb-1 text-sm">Group Name</label>
                        <input
                            type="text"
                            className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
                            value={editedGroupName}
                            onChange={(e) => setEditedGroupName(e.target.value)}
                        />
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch(`/api/chats/${chat._id}/update`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ groupName: editedGroupName })
                                    });
                                    if (res.ok) {
                                        window.dispatchEvent(new Event('refreshChats'));
                                    } else {
                                        console.error('Failed to update group name');
                                    }
                                } catch (err) {
                                    console.error('Failed to update group name:', err);
                                }
                            }}
                            className="bg-blue-600 text-white px-2 py-1 rounded mb-3 w-full"
                        >
                            Save Name
                        </button>

                        {/* Group Image */}
                        <label className="block mb-1 text-sm">Group Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="w-full p-2 mb-3 rounded bg-gray-700 text-white"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append('file', file);
                                try {
                                    const res = await fetch(`/api/admin/upload`, {
                                        method: 'POST',
                                        body: formData
                                    });
                                    const data = await res.json();
                                    if (data.url) {
                                        const updateRes = await fetch(`/api/chats/${chat._id}/update`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ groupImage: data.url })
                                        });
                                        if (updateRes.ok) {
                                            window.dispatchEvent(new Event('refreshChats'));
                                        } else {
                                            console.error('Failed to update group image');
                                        }
                                    }
                                } catch (err) {
                                    console.error('Failed to upload image:', err);
                                }
                            }}
                        />

                        {/* Members List */}
                        <h3 className="text-md font-semibold mb-2">Members:</h3>
                        <ul className="mb-3 max-h-40 overflow-y-auto">
                            {chat.members
                                .filter((member) => member && member._id)
                                .map((member) => (
                                    <li key={member._id.toString()} className="flex items-center gap-2 mb-1">
                                        <Image
                                            src={member.profileImage || '/placeholder.jpg'}
                                            alt={member.characterName}
                                            width={24}
                                            height={24}
                                            unoptimized
                                            className="w-6 h-6 object-cover rounded-full"
                                        />
                                        <span>{member.characterName}</span>
                                    </li>
                                ))}
                        </ul>

                        {/* Add New Member */}
                        <h3 className="text-md font-semibold mb-2">Add Member:</h3>
                        <Select
                            options={users
                                .filter(u => u.characterName && !chat.members.some(m => m && m._id && m._id.toString() === u._id))
                                .sort((a, b) => {
                                    const nameA = a.characterName || '';
                                    const nameB = b.characterName || '';
                                    return nameA.localeCompare(nameB);
                                })
                                .map(user => ({
                                    value: user._id,
                                    label: user.characterName
                                }))
                            }
                            onChange={(option) => {
                                const user = users.find(u => u._id === option?.value);
                                setSelectedUser(user || null);
                            }}
                            placeholder="Search and select user..."
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                                control: (provided) => ({
                                    ...provided,
                                    backgroundColor: '#1f2937',
                                    borderColor: '#4b5563',
                                    color: '#ffffff',
                                }),
                                singleValue: (provided) => ({
                                    ...provided,
                                    color: '#ffffff',
                                }),
                                menu: (provided) => ({
                                    ...provided,
                                    backgroundColor: '#1f2937',
                                    color: '#ffffff',
                                }),
                                option: (provided, state) => ({
                                    ...provided,
                                    backgroundColor: state.isFocused ? '#374151' : '#1f2937',
                                    color: '#ffffff',
                                }),
                            }}
                        />
                        <button
                            onClick={async () => {
                                if (!selectedUser) {
                                    alert('Please select a user to add.');
                                    return;
                                }
                                try {
                                    const res = await fetch(`/api/chats/${chat._id}/add-member`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ userId: selectedUser._id })
                                    });
                                    if (res.ok) {
                                        const { chat: updated } = await res.json();
                                        // make sure the backend has set `isGroup: true`
                                        chat.isGroup = updated.isGroup;
                                        chat.groupName = updated.groupName;
                                        chat.members  = updated.members;
                                        setSelectedUser(null);
                                        window.dispatchEvent(new Event('refreshChats'));
                                    } else {
                                        const data = await res.json();
                                        alert(`Failed to add member: ${data.error || 'Unknown error'}`);
                                    }
                                } catch (err) {
                                    console.error('Failed to add member:', err);
                                }
                            }}
                            className="bg-green-600 text-white px-2 py-1 rounded w-full mt-2"
                        >
                            Add Member
                        </button>

                        {/* Leave Group Button */}
                        <button
                            onClick={handleLeaveGroup}
                            className="bg-red-600 text-white px-2 py-1 rounded w-full mb-2 mt-2"
                        >
                            Leave Group
                        </button>
                        <button
                            onClick={() => setShowGroupMembers(false)}
                            className="bg-gray-600 text-white px-2 py-1 rounded w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
