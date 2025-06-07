// src/app/profile/[id]/page.tsx
import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notFound } from 'next/navigation';

async function fetchUser(id: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/users/${id}`, {
        cache: 'no-store'
    });
    if (!res.ok) {
        return null;
    }
    const data = await res.json();
    return data.user;
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
    const id = await params.id;  // ✅ Await the parameter!
    const user = await fetchUser(id);
    if (!user) notFound();

    const session = await getServerSession(authOptions);

    // ... render the profile here
    return (
        <div className="max-w-3xl mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">{user.playerName || user.email}</h1>
            <p>Character: {user.characterName || 'N/A'}</p>
            {user.profileImage && (
                <img
                    src={user.profileImage}
                    alt={user.playerName}
                    className="w-40 h-40 object-cover rounded-full mt-4"
                />
            )}
            {/* Add "Edit Profile" button if it's the same user */}
            {session?.user?.id === user._id && (
                <a
                    href={`/profile`}
                    className="inline-block mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                >
                    Edit Profile
                </a>
            )}
        </div>
    );
}
