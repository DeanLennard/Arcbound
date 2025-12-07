// src/app/(dashboard)/admin/categories/CategoriesPageClient.tsx
"use client";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Image from "next/image";

interface Category {
    _id: string;
    name: string;
    image: string;
    faction?: string;
}

const factions = [
    'The Aeon Collective',
    'The Helion Federation',
    'The Korveth Dominion',
    'The Sundered Concord',
    'The Tyr Solaris Imperium',
    'The Virean Ascendancy',
];

export default function CategoriesPageClient() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [name, setName] = useState('');
    const [image, setImage] = useState<File | ''>('');
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [faction, setFaction] = useState('');

    const fetchCategories = async () => {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        setCategories(data.categories || []);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            toast.error('Name is required');
            return;
        }

        setLoading(true);
        const toastId = toast.loading(editingId ? 'Updating category...' : 'Creating category...');

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('faction', faction);
            if (image) {
                formData.append('image', image as Blob);
            }

            let res: Response;
            if (editingId) {
                res = await fetch(`/api/admin/categories/${editingId}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                res = await fetch('/api/admin/categories', {
                    method: 'POST',
                    body: formData
                });
            }

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Failed to save category', { id: toastId });
            } else {
                toast.success(editingId ? 'Category updated' : 'Category created', { id: toastId });
                setName('');
                setImage('');
                setEditingId(null);
                fetchCategories();
            }
        } catch {
            toast.error('Something went wrong', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id: string, oldName: string, oldFaction?: string) => {
        setEditingId(id);
        setName(oldName);
        setFaction(oldFaction || '');
        setImage('');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        const res = await fetch(`/api/admin/categories/${id}`, {
            method: 'DELETE'
        });

        const data = await res.json();
        if (!res.ok) {
            toast.error(data.error || 'Failed to delete category');
        } else {
            toast.success('Category deleted');
            fetchCategories();
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Manage Categories</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mb-6">
                <input
                    type="text"
                    placeholder="Category Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="p-2 border rounded"
                    required
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || '')}
                    className="p-2 border rounded"
                />

                {editingId && (
                    <p className="text-sm text-gray-400">
                        Leave file empty to keep the current image, or upload a new one to replace it.
                    </p>
                )}
                <select
                    value={faction}
                    onChange={(e) => setFaction(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Public (no faction)</option>
                    {factions.map((f) => (
                        <option key={f} value={f}>
                            {f}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    {loading
                        ? editingId
                            ? 'Updating...'
                            : 'Creating...'
                        : editingId
                            ? 'Update Category'
                            : 'Create Category'}
                </button>
            </form>

            <h2 className="text-xl font-semibold mb-2">Existing Categories:</h2>
            <ul className="space-y-2">
                {categories.map((cat) => (
                    <li key={cat._id} className="flex items-center gap-2 border p-2 rounded justify-between">
                        <div className="flex items-center gap-2">
                            <Image
                                src={cat.image}
                                alt={cat.name}
                                width={400}
                                height={300}
                                unoptimized
                                className="w-10 h-10 object-cover rounded"
                            />
                            <span>{cat.name}</span>
                            <span className="text-sm text-gray-400">
                                {cat.faction || 'Public'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="bg-yellow-500 text-white px-2 py-1 rounded"
                                onClick={() => handleEdit(cat._id, cat.name, cat.faction)}
                            >
                                Edit
                            </button>
                            <button
                                className="bg-red-600 text-white px-2 py-1 rounded"
                                onClick={() => handleDelete(cat._id)}
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
