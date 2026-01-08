// components/ChatMessages.tsx
"use client";
import React, {useState, useEffect, useRef, useCallback} from "react";
import Linkify from "linkify-react";
import { safeImageSrc } from "@/lib/safeImageSrc";

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

    // track whether we've done the initial load yet
    const firstLoadRef = useRef(true);
    // for “load more” scroll preservation
    const prevScrollHeightRef = useRef(0);

    const loadMessages = useCallback(async (before?: string) => {
        try {
            if (!containerRef.current) return;
            setLoading(true);

            if (before) prevScrollHeightRef.current = containerRef.current.scrollHeight;

            const url = `/api/chats/${chat._id}/messages?limit=20${before ? `&before=${before}` : ""}`;
            const res = await fetch(url);

            if (!res.ok) {
                console.error("Failed to load messages:", res.status, await res.text());
                setHasMore(false);
                return;
            }

            const data = await res.json();

            setMessages(prev => {
                const all = before ? [...data.messages, ...prev] : [...data.messages];
                const unique = all.filter((m, i, arr) => arr.findIndex(x => x._id === m._id) === i);
                unique.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
                return unique;
            });

            setHasMore(data.messages.length > 0);
        } catch (err) {
            console.error("loadMessages crashed:", err);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [chat._id]);

    // initial load
    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    // after messages change, do scroll adjustments
    useEffect(() => {
        const c = containerRef.current;
        if (!c) return;

        // 1) On first load, scroll to bottom
        if (firstLoadRef.current) {
            c.scrollTop = c.scrollHeight;
            firstLoadRef.current = false;
            return;
        }

        // 2) On "load more" (we know because prevScrollHeight was set)
        if (prevScrollHeightRef.current) {
            // new scrollHeight minus old = the height of prepended content
            const newHeight = c.scrollHeight;
            c.scrollTop = newHeight - prevScrollHeightRef.current;
            prevScrollHeightRef.current = 0;
        }
    }, [messages]);

    // when user scrolls
    const handleScroll = () => {
        const c = containerRef.current;
        if (!c || loading || !hasMore) return;

        if (c.scrollTop === 0) {
            // load older
            const oldest = messages[0];
            if (oldest) {
                loadMessages(oldest.createdAt);
            }
        }
    };

    const isImageUrl = (content: string) =>
        /^\/uploads\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(content) ||
        /^https:\/\/media\.tenor\.com\/.+\.gif$/i.test(content);
    const isVideoUrl = (content: string) =>
        /^https:\/\/media\.tenor\.com\/.+\.(mp4|webm)$/i.test(content);
    const isFileUrl = (content: string) =>
        /^\/uploads\/.+\.(pdf|docx?|xlsx?|zip|rar|txt|csv)$/i.test(content);
    const isLinkUrl = (content: string) =>
        /^https?:\/\/[^\s]+$/i.test(content);

    return (
        <div
            className="p-4 max-h-[70vh] overflow-y-auto bg-gray-800 rounded"
            onScroll={handleScroll}
            ref={containerRef}
        >
            {messages.map(msg => (
                <div key={msg._id} className="mb-2">
                    <div className="flex items-center gap-2">
                        {(() => {
                            const avatarSrc = safeImageSrc(msg.senderId.profileImage) ?? "/uploads/placeholder.png";
                            return avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt={msg.senderId.characterName}
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                    onError={(e) => {
                                        e.currentTarget.src = "/uploads/placeholder.png";
                                    }}
                                />
                            ) : null;
                        })()}
                        <span className="font-bold">{msg.senderId.characterName}</span>
                        <span className="text-xs text-gray-400">
                            {new Date(msg.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <p className="ml-8 break-smart">
                        {isImageUrl(msg.content) ? (
                            (() => {
                                const contentImgSrc = safeImageSrc(msg.content) ?? "/uploads/placeholder.png";
                                return contentImgSrc ? (
                                    <img
                                        src={contentImgSrc}
                                        alt="uploaded image"
                                        width={200}
                                        height={200}
                                        className="rounded"
                                        onError={(e) => {
                                            e.currentTarget.src = "/uploads/placeholder.png";
                                        }}
                                    />
                                ) : (
                                    // fallback: show text if it looked like an image but src is invalid
                                    msg.content
                                );
                            })()
                        ) : isVideoUrl(msg.content) ? (
                            <video src={msg.content} controls className="rounded max-w-[260px]" />
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
                            <Linkify
                                options={{
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className: "text-blue-400 underline",
                                }}
                            >
                                {msg.content}
                            </Linkify>
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
