// src/app/forum/[[id]]/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Sidebar from './Sidebar';
import LikesAndComments from './LikesAndComments';
import { formatTimestamp } from '@/lib/formatTimestamp';
import { prepareHtmlForFrontend } from '@/lib/prepareHtmlForFrontend';
import Image from "next/image";
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import dynamic from "next/dynamic";
const Editor = dynamic(() => import('@/components/Editor'), { ssr: false });

interface Post {
    _id: string;
    title: string;
    content: string;
    previewImage?: string;
    category?: {
        _id: string;
        name: string;
        faction?: string;
    };
    editedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    likes?: number;
    commentsCount?: number;
    authorId: string;
    author?: {
        _id: string;
        characterName?: string;
        profileImage?: string;
    };
}

async function fetchPost(id: string): Promise<{ post: Post | null, forbidden?: boolean }> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/posts/${id}`, {
        method: 'GET',
        // Add credentials if needed
    });

    if (res.status === 403) {
        return { post: null, forbidden: true };
    } else if (!res.ok) {
        return { post: null };
    }

    const data = await res.json();
    return {
        post: {
            ...data.post,
            likes: data.post.likesCount ?? 0,
            authorId: data.post.authorId,
            author: data.post.author,
        }
    };
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedContent, setEditedContent] = useState('');
    const { data: session } = useSession();
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        const loadPost = async () => {
            const { id } = await params;
            const result = await fetchPost(id);

            if (result.forbidden) {
                setForbidden(true);
            } else if (!result.post) {
                notFound();
            } else {
                setPost(result.post);
            }

            setLoading(false);
        };
        loadPost();
    }, [params]);

    if (loading) {
        return <div className="text-center text-white mt-10">Loading...</div>;
    }

    if (forbidden) {
        return <p className="text-red-500 text-center mt-8">🚫 You do not have permission to view this post.</p>;
    }

    if (!post) {
        notFound();
    }

    const isAuthor = session?.user?.id === post.authorId;

    const handleEdit = () => {
        setEditedTitle(post.title);
        setEditedContent(post.content);
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/admin/posts`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: post._id,
                    title: editedTitle,
                    content: editedContent,
                    categoryId: post.category?._id || 'uncategorized'
                }),
            });
            if (res.ok) {
                setPost(prev => prev ? { ...prev, title: editedTitle, content: editedContent } : prev);
                setIsEditing(false);
            } else {
                const data = await res.json();
                alert(`Failed to update post: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Failed to update post:', err);
            alert('Failed to update post.');
        }
    };

    return (
        <>
            <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-4">
                <main className="flex-1">
                    {post.category && (
                        <div className="mb-4">
                            <Link
                                href={`/forum?category=${post.category._id}`}
                                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 inline-block"
                            >
                                ← Back to {post.category.name}
                            </Link>
                        </div>
                    )}
                    {post.category?.faction && (
                        <div className="mb-4 bg-yellow-800 text-yellow-100 border-l-4 border-yellow-500 p-3 rounded">
                            🔒 This post is visible only to members of <strong>{post.category.faction}</strong>.
                        </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                        <Link href={`/profile/${post.author?._id || post.authorId}`}>
                            <div className="flex items-center gap-2">
                                {post.author?.profileImage && (
                                    <div style={{ position: 'relative', width: '40px', aspectRatio: '1 / 1', borderRadius: '50%', overflow: 'hidden' }}>
                                        <Image
                                            src={post.author.profileImage}
                                            alt={post.author.characterName || 'Author'}
                                            fill
                                            unoptimized
                                            style={{ objectFit: 'cover', borderRadius: '50%' }}
                                            sizes="24px"
                                        />
                                    </div>
                                )}
                                <span className="text-sm text-gray-300">
                                    {post.author?.characterName || 'Unknown'}
                                </span>
                            </div>
                        </Link>
                        {isAuthor && !isEditing && (
                            <button
                                onClick={handleEdit}
                                className="ml-auto text-blue-500 hover:text-blue-300 text-xs underline"
                            >
                                Edit Post
                            </button>
                        )}
                    </div>
                    {isEditing ? (
                        <div className="mb-4">
                            <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="w-full p-2 rounded bg-gray-700 text-white mb-2"
                            />
                            <Editor value={editedContent} onChange={setEditedContent} />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="bg-green-600 text-white px-2 py-1 rounded"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="bg-red-600 text-white px-2 py-1 rounded"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                            <p className="text-sm text-gray-300 mb-2">
                                Category: {post.category?.name || 'Uncategorized'}
                            </p>
                            <p className="text-xs text-gray-300 mb-4">
                                Posted: {formatTimestamp(post.createdAt ?? '', post.editedAt ?? '')}
                            </p>
                            <div
                                className="prose max-w-none tiptap"
                                dangerouslySetInnerHTML={{ __html: prepareHtmlForFrontend(post.content) }}
                            />
                        </>
                    )}
                    <LikesAndComments
                        postId={post._id}
                        initialLikes={post.likes ?? 0}
                        initialCommentsCount={post.commentsCount ?? 0}
                    />
                </main>
                <div className="w-full md:w-1/3">
                    <Sidebar currentPostId={post._id} />
                </div>
            </div>
        </>
    );
}
