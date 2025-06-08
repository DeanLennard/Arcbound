// src/app/forum/[id]/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
    _id: string;
    title: string;
}

interface SidebarProps {
    currentPostId: string;
}

export default function Sidebar({ currentPostId }: SidebarProps) {
    const [latestPosts, setLatestPosts] = useState<Post[]>([]);
    const [views, setViews] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        fetch('/api/admin/posts')
            .then(res => res.json())
            .then(data => {
                const latest = data.posts
                    .filter((post: Post) => post._id !== currentPostId)
                    .slice(0, 5);
                setLatestPosts(latest);
            });

        fetch(`/api/admin/posts/${currentPostId}/sidebar`)
            .then(res => res.json())
            .then(data => {
                setViews(data.views || 0);
                setCommentsCount(data.commentsCount || 0);
            });
    }, [currentPostId]);

    return (
        <aside className="rounded shadow-sm p-6">
            <div className="border rounded shadow-sm p-6 mb-4">
                <p className="text-white">👀 {views} Views</p>
                <p className="text-white">💬 {commentsCount} Comments</p>
            </div>
            <div className="border rounded shadow-sm p-6 mb-4">
                <h3 className="font-semibold mb-2">Latest Posts</h3>
                <ul className="space-y-1">
                    {latestPosts.map(post => (
                        <li key={post._id} className="p-2">
                            <Link
                                href={`/forum/${post._id}`}
                                className="text-white hover:underline"
                            >
                                {post.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
}
