// src/app/profile/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Image from "next/image";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [playerName, setPlayerName] = useState('');
    const [characterName, setCharacterName] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetch(`/api/users/me`)
                .then(res => res.json())
                .then(data => {
                    setPlayerName(data.playerName || '');
                    setCharacterName(data.characterName || '');
                    setProfileImage(data.profileImage || '');
                })
                .catch(() => toast.error('Failed to load profile'));
        }
    }, [session]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const validExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;

        // Check MIME type:
        if (!validImageTypes.includes(file.type)) {
            toast.error('Only image files are allowed (jpg, jpeg, png, gif, webp).');
            return;
        }

        // Check file extension:
        if (!validExtensions.test(file.name)) {
            toast.error('Only image files are allowed (jpg, jpeg, png, gif, webp).');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`/api/admin/upload`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                toast.error('Image upload failed');
                return;
            }

            const data = await res.json();
            if (data.url) {
                setProfileImage(data.url);
                toast.success('Image uploaded!');
            }
        } catch {
            toast.error('An error occurred during upload');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/users/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    characterName,
                    profileImage
                })
            });
            if (res.ok) {
                toast.success('Profile updated!');
            } else {
                toast.error('Failed to update profile');
            }
        } catch {
            toast.error('Something went wrong');
        }
        setLoading(false);
    };

    if (status === 'loading') return <div>Loading...</div>;
    if (!session) return <div>You must be logged in to view this page.</div>;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Player Name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="p-2 border rounded"
                />
                <input
                    type="text"
                    placeholder="Character Name"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    className="p-2 border rounded"
                />
                <div>
                    <label className="block mb-1">Profile Image</label>
                    {profileImage && (
                        <div style={{ position: 'relative', width: '5%', aspectRatio: '1 / 1', borderRadius: '50%', overflow: 'hidden' }}>
                            <Image
                                src={profileImage}
                                alt="Profile"
                                fill
                                unoptimized
                                style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="p-2 border rounded bg-gray-800 text-white"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    {loading ? 'Updating...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}
