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
        if (!session) return;
        fetch(`/api/users/${session.user.id}`)
            .then(res => res.json())
            .then(data => {
                setPlayerName(data.user.playerName || '');
                setCharacterName(data.user.characterName || '');
                setProfileImage(data.user.profileImage || '');
                setLoading(false);
            });
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch(`/api/users/${session?.user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName, characterName, profileImage })
        });
        if (res.ok) {
            toast.success('Profile updated!');
            router.push(`/profile/${session?.user.id}`);
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
                <input
                    type="text"
                    placeholder="Profile Image URL"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    className="p-2 border rounded"
                />
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
