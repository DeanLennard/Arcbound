// /src/app/forum/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/formatTimestamp';
import {useSession} from "next-auth/react";

interface Post {
    _id: string;
    title: string;
    content: string;
    previewImage?: string;
    category?: { _id: string; name: string };
    createdAt?: string;
    updatedAt?: string;
    author?: { characterName?: string; profileImage?: string };
    comments?: { content: string }[];
}

interface Category {
    _id: string;
    name: string;
    image: string;
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, '');
}

export default function ForumPage() {
    const { data: session, status } = useSession();

    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const userRole = session?.user?.role || '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postsRes, categoriesRes] = await Promise.all([
                    fetch('/api/admin/posts'),
                    fetch('/api/admin/categories')
                ]);

                if (!postsRes.ok || !categoriesRes.ok) {
                    throw new Error('Failed to load posts or categories');
                }

                const postsData = await postsRes.json();
                const categoriesData = await categoriesRes.json();

                setPosts(postsData.posts || []);
                setCategories(categoriesData.categories || []);
            } catch (error) {
                console.error('Error fetching forum data:', error);
                // Optionally, show an error message or toast
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredPosts = posts
        .filter((post) => {
            const strippedContent = stripHtml(post.content);
            const searchLower = searchQuery.toLowerCase();

            // Search in title or post content
            const matchesTitleOrContent =
                post.title.toLowerCase().includes(searchLower) ||
                strippedContent.toLowerCase().includes(searchLower);

            // Search in comments (if they exist)
            const matchesComment = post.comments?.some((comment: any) =>
                comment.content.toLowerCase().includes(searchLower)
            );

            return matchesTitleOrContent || matchesComment;
        })
        .filter((post) => {
            if (!selectedCategoryId) return false;
            if (selectedCategoryId === 'all') return true;
            return post.category?._id === selectedCategoryId;
        });

    if (loading) {
        return <div>Loading posts...</div>;
    }

    if (status === 'loading') {
        return <div>Loading session...</div>;
    }

    // 🚫 User not authenticated or role is 'none'
    if (!session || userRole === 'none') {
        return (
            <div className="max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto p-4">
                <div className="flex justify-center mt-8">
                    <p className="text-lg text-red-500">
                        🚫 You need to be approved to access this forum.
                    </p>
                </div>
            </div>
        );
    }

    // ✅ User authenticated and approved — render the forum!
    return (
        <div className="max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto p-4">
            <div className="relative mb-6">
                {/* Banner Image */}
                <div
                    className="bg-cover bg-center h-64 flex flex-col items-center justify-center"
                    style={{
                        backgroundImage: "url('/banner.jpg')"
                    }}
                >
                    <h1 className="text-6xl font-bold text-white shadow-lg text-center">
                        Relay
                    </h1>
                    <p className="mt-2 text-xl text-white text-center shadow-md">
                        Join discussions, share insights, and connect with the community.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 items-center">
                {selectedCategoryId && (
                    <button
                        onClick={() => setSelectedCategoryId(null)}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                        ← Back to Categories
                    </button>
                )}
                <button
                    onClick={() => setSelectedCategoryId("all")}
                    className={`px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 ${
                        selectedCategoryId === "all" ? "bg-gray-800" : ""
                    }`}
                >
                    All Posts
                </button>
                {selectedCategoryId && (
                    <>
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 p-2 border rounded bg-gray-800 text-white"
                        />
                        {selectedCategoryId !== 'all' && (
                            <Link
                                href={`/forum/create?category=${selectedCategoryId}`}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                            >
                                + Create Post
                            </Link>
                        )}
                    </>
                )}
            </div>

            {/* Categories */}
            {!selectedCategoryId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {categories.map((cat) => (
                        <div
                            key={cat._id}
                            onClick={() => setSelectedCategoryId(cat._id)}
                            className={`border rounded shadow-sm p-4 flex flex-col cursor-pointer hover:bg-gray-600 transition-colors`}
                        >
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-40 object-cover rounded mb-2"
                            />
                            <h3 className="font-bold text-lg">{cat.name}</h3>
                        </div>
                    ))}
                </div>
            )}

            {/* Posts */}
            {selectedCategoryId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map((post) => (
                            <Link
                                key={post._id}
                                href={`/forum/${post._id}`}
                                className="border rounded shadow-sm p-6 flex flex-col cursor-pointer hover:bg-gray-600 transition-colors"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {post.author?.profileImage && (
                                        <img
                                            src={post.author.profileImage}
                                            alt={post.author.characterName || 'Author'}
                                            className="w-8 h-8 object-cover rounded-full"
                                        />
                                    )}
                                    <span className="text-sm text-gray-400">
                                        {post.author?.characterName || 'Unknown'}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                                <p className="text-xs text-gray-400 mb-2">
                                    {formatTimestamp(post.createdAt, post.updatedAt)}
                                </p>
                                {post.previewImage && (
                                    <img
                                        src={post.previewImage}
                                        alt={post.title}
                                        className="w-full h-40 object-cover rounded mb-2"
                                    />
                                )}
                                <p className="text-sm text-gray-100 mb-2">
                                    Category: {post.category?.name || 'Uncategorized'}
                                </p>
                                <p className="text-sm text-gray-100 line-clamp-3">
                                    {stripHtml(post.content)}
                                </p>
                            </Link>
                        ))
                    ) : (
                        <p className="text-gray-400">No posts found.</p>
                    )}
                </div>
            )}

            {/* Latest Posts */}
            {!selectedCategoryId && (
                <>
                    <h2 className="text-2xl font-bold mt-8 mb-4">Latest Posts</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {posts
                            .sort((a, b) =>
                                new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
                            )
                            .slice(0, 3)
                            .map((post) => (
                                <Link
                                    key={post._id}
                                    href={`/forum/${post._id}`}
                                    className="border rounded shadow-sm p-4 flex flex-col cursor-pointer hover:bg-gray-600 transition-colors"
                                >
                                    <h3 className="font-bold text-md mb-1">{post.title}</h3>
                                    <p className="text-xs text-gray-400 mb-2">
                                        {formatTimestamp(post.createdAt, post.updatedAt)}
                                    </p>
                                    {post.previewImage && (
                                        <img
                                            src={post.previewImage}
                                            alt={post.title}
                                            className="w-full h-24 object-cover rounded mb-2"
                                        />
                                    )}
                                    <p className="text-xs text-gray-100 mb-2">
                                        Category: {post.category?.name || 'Uncategorized'}
                                    </p>
                                    <p className="text-xs text-gray-100 line-clamp-3">
                                        {stripHtml(post.content)}
                                    </p>
                                </Link>
                            ))}
                    </div>
                </>
            )}
        </div>
    );
}
