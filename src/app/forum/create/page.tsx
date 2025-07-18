// src/app/forum/create/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Editor from '@/components/Editor';

interface Category {
    _id: string;
    name: string;
}

function CreatePostContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const selectedCategoryId = searchParams?.get('category');
    const [categoryName, setCategoryName] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();

            if (selectedCategoryId) {
                const selectedCategory = data.categories.find(
                    (cat: Category) => cat._id === selectedCategoryId
                );
                setCategoryName(selectedCategory?.name || 'Unknown');
            }
        };

        fetchCategories();
    }, [selectedCategoryId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !selectedCategoryId) {
            toast.error('Title, content, and category are required');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Creating post...');
        try {
            const res = await fetch('/api/admin/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    categoryId: selectedCategoryId
                })
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Failed to create post', { id: toastId });
            } else {
                toast.success('Post created', { id: toastId });
                router.push(`/forum/${data.post._id}`);
            }
        } catch {
            toast.error('Something went wrong', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">
                Creating Post {categoryName && `in ${categoryName}`}
            </h1>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Post Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="p-2 border rounded bg-gray-800 text-white"
                    required
                />

                <Editor value={content} onChange={setContent} />

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                >
                    {loading ? 'Submitting...' : 'Create Post'}
                </button>
            </form>
        </div>
    );
}

export default function CreatePostPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreatePostContent />
        </Suspense>
    );
}
