// /src/components/CommentForm.tsx
'use client';

import React, { useState } from 'react';
const Editor = dynamic(() => import('@/components/Editor'), { ssr: false });

export default function CommentForm({ postId }: { postId: string }) {
    const [content, setContent] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Add logic to POST comment content to /api/posts/[id]/comments
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 border rounded p-4">
            <Editor value={content} onChange={setContent} />
            <button
                type="submit"
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
                Post Comment
            </button>
        </form>
    );
}
