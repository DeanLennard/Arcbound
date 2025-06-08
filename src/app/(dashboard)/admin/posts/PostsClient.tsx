// src/app/(dashboard)/admin/posts/PostsClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Editor from '@/components/Editor';
import Image from "next/image";

interface Post {
    _id: string;
    title: string;
    content: string;
    previewImage?: string;
    category?: { name: string; _id: string };
    createdAt?: string;
    updatedAt?: string;
}

interface Category {
    _id: string;
    name: string;
    image: string;
}

export default function PostsClient() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchPosts();
        fetchCategories();
    }, []);

    const fetchPosts = async () => {
        const res = await fetch('/api/admin/posts');
        const data: { posts: Post[] } = await res.json();
        setPosts(data.posts || []);
    };

    const fetchCategories = async () => {
        const res = await fetch('/api/admin/categories');
        const data: { categories: Category[] } = await res.json();
        setCategories(data.categories || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !categoryId) {
            toast.error('Title, content, and category are required');
            return;
        }

        setLoading(true);
        const toastId = toast.loading(editingPostId ? 'Updating post...' : 'Creating post...');
        try {
            const res = await fetch('/api/admin/posts', {
                method: editingPostId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingPostId,
                    title,
                    content,
                    categoryId
                })
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Failed to save post', { id: toastId });
            } else {
                toast.success(editingPostId ? 'Post updated' : 'Post created', { id: toastId });
                setTitle('');
                setContent('');
                setCategoryId('');
                setEditingPostId(null);
                fetchPosts();
            }
        } catch {
            toast.error('Something went wrong', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const res = await fetch(`/api/admin/posts/${postId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Failed to delete post');
            } else {
                toast.success('Post deleted');
                fetchPosts();
            }
        } catch {
            toast.error('Something went wrong');
        }
    };

    const filteredPosts = posts.filter((post) => {
        const lowerSearch = search.toLowerCase();
        return (
            post.title.toLowerCase().includes(lowerSearch) ||
            post.content.toLowerCase().includes(lowerSearch)
        );
    });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Manage Posts</h1>

            {/* Create Post Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl mb-8">
                <input
                    type="text"
                    placeholder="Post Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="p-2 border rounded"
                    required
                />

                <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="p-2 border rounded bg-gray-800 text-white"
                    required
                >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                {/* Tiptap Editor */}
                <Editor value={content} onChange={setContent} />

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    {editingPostId ? 'Update Post' : 'Create Post'}
                </button>
            </form>

            {/* List Posts */}
            <h2 className="text-xl font-semibold mb-2">Existing Posts:</h2>
            <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="p-2 border rounded mb-4"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredPosts.map((post) => (
                    <div key={post._id} className="border rounded shadow-sm p-4 flex flex-col">
                        {post.previewImage && (
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 2' }}>
                                <Image
                                    src={post.previewImage}
                                    alt={post.title}
                                    fill
                                    style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                        )}
                        <h3 className="font-bold text-lg mb-1">{post.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Category: {post.category?.name || 'Uncategorized'}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                            Created: {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'N/A'}
                            {post.updatedAt && post.updatedAt !== post.createdAt && (
                                <> | Updated: {new Date(post.updatedAt).toLocaleString()}</>
                            )}
                        </p>
                        <div className="flex gap-2 mt-auto">
                            <button
                                onClick={() => {
                                    setTitle(post.title);
                                    setContent(post.content);
                                    setCategoryId(post.category?._id || '');
                                    setEditingPostId(post._id);
                                }}
                                className="px-2 py-1 bg-yellow-500 text-white rounded"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(post._id)}
                                className="px-2 py-1 bg-red-600 text-white rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
