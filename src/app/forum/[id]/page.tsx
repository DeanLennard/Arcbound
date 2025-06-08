// /src/app/forum/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import Sidebar from './Sidebar';
import LikesAndComments from './LikesAndComments';
import { formatTimestamp } from '@/lib/formatTimestamp';
import { prepareHtmlForFrontend } from '@/lib/prepareHtmlForFrontend';
import { GET as getPost } from '@/app/api/admin/posts/[id]/route';

interface Post {
    _id: string;
    title: string;
    content: string;
    previewImage?: string;
    category?: { name: string };
    createdAt?: string;
    likes?: number;
    commentsCount?: number;
}

async function fetchPost(id: string): Promise<Post | null> {
    const res = await getPost(Request, { params: { id } });
    if (!res.ok) {
        return null;
    }
    const data = await res.json();
    return {
        ...data.post,
        likes: data.post.likesCount ?? 0,
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
                    <div className="flex items-center gap-2 mb-2">
                        {post.author?.profileImage && (
                            <img
                                src={post.author.profileImage}
                                alt={post.author.characterName || 'Author'}
                                className="w-8 h-8 object-cover rounded-full"
                            />
                        )}
                        <span className="text-sm text-gray-300">
                            {post.author?.characterName || 'Unknown'}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                    <p className="text-sm text-gray-300 mb-2">
                        Category: {post.category?.name || 'Uncategorized'}
                    </p>
                    <p className="text-xs text-gray-300 mb-4">
                        Posted: {formatTimestamp(post.createdAt, post.updatedAt)}
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
