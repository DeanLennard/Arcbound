// /src/app/forum/ForumPageClient.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/formatTimestamp';
import {useSession} from "next-auth/react";
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

interface Post {
    _id: string;
    title: string;
    content: string;
    previewImage?: string;
    category?: { _id: string; name: string };
    createdAt?: string;
    updatedAt?: string;
    author?: { characterName?: string; profileImage?: string };
    comments?: Comment[];
}

interface Category {
    _id: string;
    name: string;
    image: string;
}

interface Comment {
    content: string;
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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);

    const userRole = (session?.user as { role?: string })?.role || '';

    const searchParams = useSearchParams();

    useEffect(() => {
        setPosts([]);
        setPage(1);
        setHasMore(true);
        setLoading(true);
    }, [selectedCategoryId]);

    useEffect(() => {
        if (!selectedCategoryId) return;

        const url = selectedCategoryId === 'all'
            ? `/api/admin/posts?page=${page}&limit=10`
            : `/api/admin/posts?category=${selectedCategoryId}&page=${page}&limit=10`;

        const fetchInitialPosts = async () => {
            setPostsLoading(true);
            try {
                const res = await fetch(url);
                const data = await res.json();
                setPosts(data.posts);
                setHasMore(data.currentPage < data.totalPages);
                setPage(2);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setPostsLoading(false);
            }
        };

        fetchInitialPosts();
    }, [selectedCategoryId]);

    useEffect(() => {
        if (!loadMoreRef.current || !hasMore) return;

        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !loading) {
                loadMorePosts();
            }
        });

        observer.current.observe(loadMoreRef.current);

        return () => observer.current && observer.current.disconnect();
    }, [hasMore, loading, selectedCategoryId]);

    const loadMorePosts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/posts?category=${selectedCategoryId}&page=${page}&limit=10`);
            const data = await res.json();
            setPosts((prev) => [...prev, ...data.posts]);
            setHasMore(page < data.totalPages);
            setPage((prev) => prev + 1);
        } catch (error) {
            console.error('Error loading more posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const categoryFromUrl = searchParams?.get('category');
        if (categoryFromUrl) {
            setSelectedCategoryId(categoryFromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchCategories = async () => {
            setCategoriesLoading(true);
            try {
                const res = await fetch('/api/admin/categories');
                if (!res.ok) throw new Error('Failed to load categories');
                const data = await res.json();
                setCategories(data.categories || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
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
            const matchesComment = post.comments?.some((comment: Comment) =>
                comment.content.toLowerCase().includes(searchLower)
            );

            return matchesTitleOrContent || matchesComment;
        })
        .filter((post) => {
            if (!selectedCategoryId) return false;
            if (selectedCategoryId === 'all') return true;
            return post.category?._id === selectedCategoryId;
        });

    if (categoriesLoading) {
        return <div>Loading categories...</div>;
    }

    if (postsLoading) {
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
                {!selectedCategoryId && (
                <button
                    onClick={() => setSelectedCategoryId("all")}
                    className={`px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 ${
                        selectedCategoryId === "all" ? "bg-gray-800" : ""
                    }`}
                >
                    All Posts
                </button>
                )}
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
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 2' }}>
                                <Image
                                    src={cat.image}
                                    alt={cat.name}
                                    fill
                                    unoptimized
                                    style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
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
                            <>
                                <Link
                                    key={post._id}
                                    href={`/forum/${post._id}`}
                                    className="border rounded shadow-sm p-6 flex flex-col cursor-pointer hover:bg-gray-600 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {post.author?.profileImage && (
                                            <div style={{ position: 'relative', width: '5%', aspectRatio: '1 / 1', borderRadius: '50%', overflow: 'hidden' }}>
                                                <Image
                                                    src={post.author.profileImage}
                                                    alt={post.author.characterName || 'Author'}
                                                    fill
                                                    unoptimized
                                                    style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                />
                                            </div>
                                        )}
                                        <span className="text-sm text-gray-400">
                                            {post.author?.characterName || 'Unknown'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                                    <p className="text-sm text-gray-100 mb-2">
                                        Category: {post.category?.name || 'Uncategorized'}
                                    </p>
                                    <p className="text-xs text-gray-400 mb-2">
                                        {formatTimestamp(post.createdAt ?? '', post.updatedAt ?? '')}
                                    </p>
                                    {post.previewImage && (
                                        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 2' }}>
                                            <Image
                                                src={post.previewImage}
                                                alt={post.title}
                                                fill
                                                unoptimized
                                                style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-100 line-clamp-3">
                                        {stripHtml(post.content)}
                                    </p>
                                </Link>
                            </>
                        ))
                    ) : (
                        <p className="text-gray-400">No posts found.</p>
                    )}
                    {/* Loader trigger */}
                    {hasMore && (
                        <div ref={loadMoreRef} className="text-center p-4">
                            <span>Loading more posts...</span>
                        </div>
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
                                        {formatTimestamp(post.createdAt ?? '', post.updatedAt ?? '')}
                                    </p>
                                    {post.previewImage && (
                                        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 2' }}>
                                            <Image
                                                src={post.previewImage}
                                                alt={post.title}
                                                fill
                                                unoptimized
                                                style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
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
