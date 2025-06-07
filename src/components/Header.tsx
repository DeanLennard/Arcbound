// src/components/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { BellIcon } from 'lucide-react';

export default function Header() {
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (session) {
            fetch('/api/notifications/unread-count')
                .then(res => res.json())
                .then(data => setUnreadCount(data.unreadCount || 0))
                .catch(err => console.error('Failed to fetch unread count:', err));
        }
    }, [session]);

    return (
        <header className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Link href="/" className="text-xl font-bold hover:underline">
                    Arcbound
                </Link>
                <nav className="flex items-center gap-4">
                    <Link href="/forum" className="hover:underline">
                        Relay
                    </Link>
                    <Link href="/story" className="hover:underline">
                        Story
                    </Link>
                    <Link href="/tools" className="hover:underline">
                        Tools
                    </Link>
                </nav>
            </div>
            <div className="flex items-center gap-2">
                {session ? (
                    <>
                        <Link href="/notifications" className="relative">
                            <BellIcon className="w-6 h-6 text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-600 text-xs text-white rounded-full px-1">
                                  {unreadCount}
                                </span>
                            )}
                        </Link>
                        {/* Profile link for logged-in users */}
                        <Link
                            href={`/profile/${session.user.id}`}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                        >
                            Profile
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            href="/login"
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        >
                            Register
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}
