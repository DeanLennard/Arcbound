// src/app/profile/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [playerName, setPlayerName] = useState('');
    const [characterName, setCharacterName] = useState('');
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        if (!session?.user?.id) return;
        fetch(`/api/users/${session.user.id}`)
            .then(res => res.json())
            .then(data => {
                setPlayerName(data.user.playerName || '');
                setCharacterName(data.user.characterName || '');
                setProfileImage(data.user.profileImage || '');
                setLoading(false);
            });
    }, [session]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;

        // Check MIME type
        if (!validImageTypes.includes(file.type)) {
            toast.error('Only image files are allowed (jpg, jpeg, png, gif, webp).');
            return;
        }

        // Check extension
        if (!allowedExtensions.test(file.name)) {
            toast.error('Only image files are allowed (jpg, jpeg, png, gif, webp).');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                toast.error('Failed to upload image.');
                return;
            }

            const data = await res.json();
            if (data.url) {
                setProfileImage(data.url);
                toast.success('Image uploaded successfully!');
            } else {
                toast.error('Invalid response from server.');
            }
        } catch (err) {
            console.error('Image upload error:', err);
            toast.error('Failed to upload image.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch(`/api/users/${session?.user?.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName, characterName, profileImage })
        });
        if (res.ok) {
            toast.success('Profile updated!');
            router.push(`/profile/${session?.user?.id}`);
        } else {
            toast.error('Failed to update profile.');
        }
        setLoading(false);
    };

    if (!session) {
        return <div>Please login to edit your profile.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
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
                {/* File Upload (images only) */}
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="p-2 border rounded"
                />

                {/* Preview */}
                {profileImage && (
                    <div className="mt-2">
                        <img
                            src={profileImage}
                            alt="Profile Preview"
                            className="w-24 h-24 object-cover rounded"
                        />
                    </div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}
