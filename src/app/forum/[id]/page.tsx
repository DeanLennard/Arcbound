// /src/app/forum/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import Sidebar from './Sidebar';
import LikesAndComments from './LikesAndComments';
import { formatTimestamp } from '@/lib/formatTimestamp';
import { prepareHtmlForFrontend } from '@/lib/prepareHtmlForFrontend';
import Image from "next/image";
import Link from 'next/link';

interface Post {
    _id: string;
    title: string;
    content: string;
    previewImage?: string;
    category?: {
        _id: string;
        name: string;
    };
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

async function fetchPost(id: string): Promise<Post | null> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/posts/${id}`, {
        method: 'GET',
        // you can pass cookies/headers here if needed for auth
    });
    if (!res.ok) {
        return null;
    }
    const data = await res.json();
    return {
        ...data.post,
        likes: data.post.likesCount ?? 0,
        authorId: data.post.authorId,
        author: data.post.author
    };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = await fetchPost(id);
    if (!post) {
        notFound();
    }

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
                    </div>
                    <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                    <p className="text-sm text-gray-300 mb-2">
                        Category: {post.category?.name || 'Uncategorized'}
                    </p>
                    <p className="text-xs text-gray-300 mb-4">
                        Posted: {formatTimestamp(post.createdAt ?? '', post.updatedAt ?? '')}
                    </p>
                    <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: prepareHtmlForFrontend(post.content) }}
                    />
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
