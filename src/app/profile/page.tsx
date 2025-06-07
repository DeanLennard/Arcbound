// src/app/profile/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

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
                .catch(err => toast.error('Failed to load profile'));
        }
    }, [session]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
        } catch (err) {
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
        } catch (err) {
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
                        <img src={profileImage} alt="Profile" className="w-32 h-32 object-cover rounded mb-2" />
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
