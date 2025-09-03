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

    // track whether we've done the initial load yet
    const firstLoadRef = useRef(true);
    // for “load more” scroll preservation
    const prevScrollHeightRef = useRef(0);

    const loadMessages = useCallback(async (before?: string) => {
        if (!containerRef.current) return;
        setLoading(true);

        // if this is a "load more", capture the current scrollHeight
        if (before) {
            prevScrollHeightRef.current = containerRef.current.scrollHeight;
        }

        const url = `/api/chats/${chat._id}/messages?limit=20${
            before ? `&before=${before}` : ""
        }`;
        const res = await fetch(url);
        const data = await res.json();

        setMessages(prev => {
            // prepend older messages if `before`, otherwise replace entirely
            const all = before
                ? [...data.messages, ...prev]
                : [...data.messages];
            // dedupe & sort
            const unique = all.filter(
                (m, i, arr) => arr.findIndex(x => x._id === m._id) === i
            );
            unique.sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return unique;
        });

        setHasMore(data.messages.length > 0);
        setLoading(false);
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
        /^https:\/\/media\.tenor\.com\/.+\.(gif|mp4|webm)$/i.test(content);
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
                        <span className="text-xs text-gray-400">
              {new Date(msg.createdAt).toLocaleString()}
            </span>
                    </div>
                    <p className="ml-8 break-smart">
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
                                rel="noopener noreferrer 1"
                                className="text-blue-400 underline"
                            >
                                test
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
