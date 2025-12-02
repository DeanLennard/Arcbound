// src/app/profile/[[id]]/page.tsx
import React from 'react';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import { notFound } from 'next/navigation';
import Image from "next/image";
import { GET as getUser } from '@/pages/api/users/[id]';
import NotificationToggle from '@/components/NotificationToggle';

async function fetchUser(id: string) {
    const response = await getUser(
        new Request(`http://localhost:3000/api/users/${id}`),
        { params: { id } }
    );
    const data = await response.json();
    return data.user;
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await fetchUser(id);
    if (!user) notFound();

    const session = await getServerSession(authOptions);

    return (
        <div className="max-w-3xl mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">{user.playerName || user.email}</h1>
            <p>Character: {user.characterName || 'N/A'}</p>
            {user.profileImage && (
                <div style={{ position: 'relative', width: '20%', aspectRatio: '1 / 1', borderRadius: '50%', overflow: 'hidden' }}>
                    <Image
                        src={user.profileImage}
                        alt={user.playerName}
                        fill
                        unoptimized
                        style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            )}
            {/* Add "Edit Profile" button if it's the same user */}
            {session?.user?.id === user._id && (
                <div className="mt-4 flex items-center">
                    <a
                        href={`/profile`}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                    >
                        Edit Profile
                    </a>
                    <NotificationToggle />
                </div>
            )}
        </div>
    );
}
