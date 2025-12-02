// /src/app/forum/[[id]]/LikesAndComments.tsx
'use client';

import React, {useCallback, useEffect, useState} from 'react';
import dynamic from 'next/dynamic';
const Editor = dynamic(() => import('@/components/Editor'), { ssr: false });
import toast from 'react-hot-toast';
import {formatTimestamp} from "@/lib/formatTimestamp";
import { prepareHtmlForFrontend } from '@/lib/prepareHtmlForFrontend';
import Image from "next/image";

interface Props {
    postId: string;
    initialLikes: number;
    initialCommentsCount: number;
}

interface CommentType {
    _id: string;
    content: string;
    author?: { characterName?: string; profileImage?: string };
    createdAt?: string;
    updatedAt?: string;
    likesCount?: number;
    children?: CommentType[];
}

export default function LikesAndComments({ postId, initialLikes }: Props) {
    const [likes, setLikes] = useState(initialLikes ?? 0);
    const [postLikers,    setPostLikers]    = useState<string[]|null>(null);
    const [commentLikers, setCommentLikers] = useState<Record<string,string[]>>({});
    const [tooltipOpen,   setTooltipOpen]   = useState<Record<string,boolean>>({});
    const [comments, setComments] = useState<CommentType[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const fetchComments = useCallback(async () => {
        const res = await fetch(`/api/posts/${postId}/comments`);
        const data = await res.json();
        setComments(data.comments || []);
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleLike = async () => {
        const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            setLikes(data.likes);
        } else {
            toast.error('Failed to like post.');
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
        e.preventDefault();
        const text = parentId ? replyContent : newComment;
        if (!text.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text, parentId })
            });
            if (res.ok) {
                const data = await res.json();
                setComments(prev => [...prev, data.comment]);
                if (parentId) {
                    setReplyingTo(null);
                    setReplyContent('');
                } else {
                    setNewComment('');
                }
                toast.success('Comment posted!');
                await fetchComments();
            } else {
                toast.error('Failed to post comment.');
            }
        } catch {
            toast.error('An error occurred.');
        }
        setLoading(false);
    };

    const updateLikesInTree = (comments: CommentType[], commentId: string, newLikes: number): CommentType[] => {
        return comments.map(comment => {
            if (comment._id === commentId) {
                return { ...comment, likesCount: newLikes };
            } else if (comment.children && comment.children.length > 0) {
                return {
                    ...comment,
                    children: updateLikesInTree(comment.children, commentId, newLikes)
                };
            } else {
                return comment;
            }
        });
    };

    const handleCommentLike = async (commentId: string) => {
        const res = await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            setComments(prev => updateLikesInTree(prev, commentId, data.likes));
        } else {
            toast.error('Failed to like comment.');
        }
    };

    const renderComments = (comments: CommentType[]) => {

        return comments.map(comment => (
            <div
                key={comment._id}
                className="bg-gray-800 p-2 rounded mb-2"
            >
                <div className="flex items-center gap-2 mt-2">
                    {comment.author?.profileImage && (
                        <div style={{ position: 'relative', width: '5%', aspectRatio: '1 / 1', borderRadius: '50%', overflow: 'hidden' }}>
                            <Image
                                src={comment.author.profileImage}
                                alt={comment.author.characterName || 'Author'}
                                fill
                                unoptimized
                                style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    )}
                    <span className="text-xs text-gray-400">
                        {comment.author?.characterName || 'Unknown'} (
                            {formatTimestamp(comment.createdAt ?? '', comment.updatedAt ?? '')}
                        )
                    </span>
                </div>
                <div
                    className="prose max-w-none p-5 break-smart"
                    dangerouslySetInnerHTML={{ __html: prepareHtmlForFrontend(comment.content) }}
                />
                <div className="relative inline-block">
                    <button
                        onClick={() => handleCommentLike(comment._id)}
                        onMouseEnter={async () => {
                            // open this comment’s tooltip
                            setTooltipOpen(o => ({ ...o, [comment._id]: true }));
                            // load likers only once per comment
                            if (!commentLikers[comment._id]) {
                                const res = await fetch(`/api/comments/${comment._id}/like`);
                                if (res.ok) {
                                    const { likers } = await res.json();
                                    setCommentLikers(c => ({ ...c, [comment._id]: likers }));
                                }
                            }
                        }}
                        onMouseLeave={() => {
                            setTooltipOpen(o => ({ ...o, [comment._id]: false }));
                        }}
                        className="bg-blue-600 text-white px-2 py-1 rounded mt-1 mr-2"
                    >
                        👍 {comment.likesCount ?? 0}
                    </button>

                    {tooltipOpen[comment._id] && commentLikers[comment._id] && (
                        <div className="
                            absolute bottom-full left-1/2 transform -translate-x-1/2
                            bg-gray-800 text-white text-sm rounded shadow p-2
                            whitespace-nowrap z-10"
                        >
                            {commentLikers[comment._id].length > 0
                                ? commentLikers[comment._id].map((name,i) => <div key={i}>{name}</div>)
                                : <div className="italic">No likes yet</div>
                            }
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setReplyingTo(comment._id)}
                    className="text-sm text-blue-400 hover:underline"
                >
                    Reply
                </button>
                {replyingTo === comment._id && (
                    <form onSubmit={(e) => handleCommentSubmit(e, comment._id)} className="mt-2 border rounded p-2 bg-gray-700">
                        <Editor value={replyContent} onChange={setReplyContent} />
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
                        >
                            {loading ? 'Posting...' : 'Post Reply'}
                        </button>
                    </form>
                )}
                {/* Recursive render children */}
                {comment.children &&
                    comment.children.length > 0 &&
                    renderComments(comment.children)}
            </div>
        ));
    };

    return (
        <div className="mt-6">
            <div className="relative inline-block mb-4">
                <button
                    onClick={handleLike}
                    onMouseEnter={async () => {
                        setTooltipOpen(o => ({ ...o, post: true }));
                        if (postLikers===null) {
                            const res = await fetch(`/api/posts/${postId}/like`);
                            if (res.ok) {
                                const { likers } = await res.json();
                                setPostLikers(likers);
                            }
                        }
                    }}
                    onMouseLeave={() => setTooltipOpen(o => ({ ...o, post: false }))}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    👍 Like ({likes})
                </button>

                {tooltipOpen.post && postLikers && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2
                    bg-gray-800 text-white text-sm rounded shadow p-2 whitespace-nowrap z-10">
                        {postLikers.length > 0
                            ? postLikers.map((name,i) => <div key={i}>{name}</div>)
                            : <div className="italic">No likes yet</div>
                        }
                    </div>
                )}
            </div>

            {/* Comment Form */}
            <form onSubmit={e => handleCommentSubmit(e)} className="mt-4 border rounded p-4 bg-gray-800">
                <Editor value={newComment} onChange={setNewComment} />
                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
                >
                    {loading ? 'Posting...' : 'Post Comment'}
                </button>
            </form>

            {/* Comments */}
            <h2 className="text-xl font-semibold mb-2 p-2">Comments</h2>
            <div className="break-words break-all">{renderComments(comments)}</div>
        </div>
    );
}
