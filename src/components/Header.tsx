// src/components/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import useSWR from 'swr';
import { BellIcon, Menu, X } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Header() {
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);

    // fetch unread notifications count
    useEffect(() => {
        if (session) {
            fetch('/api/notifications/unread-count')
                .then(res => res.json())
                .then(data => setUnreadCount(data.unreadCount || 0))
                .catch(console.error);
        }
    }, [session]);

    // 1) fetch this user’s *single* active character (or null)
    const { data: activeChar } = useSWR(
        session ? '/api/characters/me' : null,
        fetcher
    );

    // 2) if that character has an arcship, grab its ID (could be string or populated object)
    const arcId =
        typeof activeChar?.arcship === 'string'
            ? activeChar.arcship
            : activeChar?.arcship?._id;

    // 3) fetch the arcship details only when arcId is set
    const { data: ship } = useSWR(
        arcId ? `/api/arcships/${arcId}` : null,
        fetcher
    );

    const toggleMenu = () => setMenuOpen(o => !o);

    return (
        <header className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center relative">
            {/* Left: Logo + desktop nav */}
            <div className="flex items-center gap-4">
                <Link href="/forum" className="text-xl font-bold hover:underline">
                    Arcbound
                </Link>
                <nav className="hidden md:flex items-center gap-4">
                    <Link href="/" className="hover:underline">Home</Link>
                    <Link href="/forum" className="hover:underline">Relay</Link>
                    <Link href="/tools" className="hover:underline">Tools</Link>
                </nav>
            </div>

            {/* Right: user actions */}
            <div className="flex items-center gap-2">
                {session ? (
                    <>
                        {/* notifications */}
                        <Link href="/notifications" className="relative">
                            <BellIcon className="w-6 h-6" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-600 text-xs rounded-full px-1">
                  {unreadCount}
                </span>
                            )}
                        </Link>

                        {/* link to character (if any) */}
                        {activeChar && (
                            <Link
                                href={`/characters/${activeChar._id}`}
                                className="bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded text-sm"
                            >
                                My Character: {activeChar.charName}
                            </Link>
                        )}

                        {/* link to ship (if any) */}
                        {ship && (
                            <Link
                                href={`/arcships/${ship._id}`}
                                className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm"
                            >
                                My Ship: {ship.name}
                            </Link>
                        )}

                        {/* profile & logout */}
                        <Link
                            href={`/profile/${session.user.id}`}
                            className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded hidden md:inline"
                        >
                            Profile
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded hidden md:inline"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            href="/login"
                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded hidden md:inline"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded hidden md:inline"
                        >
                            Register
                        </Link>
                    </>
                )}

                {/* mobile menu button */}
                <button onClick={toggleMenu} className="md:hidden">
                    {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* mobile dropdown */}
            {menuOpen && (
                <div className="absolute top-full left-0 w-full bg-gray-900 flex flex-col gap-2 px-4 py-3 z-50">
                    <Link href="/" className="hover:underline" onClick={toggleMenu}>Home</Link>
                    <Link href="/forum" className="hover:underline" onClick={toggleMenu}>Relay</Link>
                    <Link href="/tools" className="hover:underline" onClick={toggleMenu}>Tools</Link>
                    {session ? (
                        <>
                            <Link
                                href={`/profile/${session.user.id}`}
                                className="hover:underline"
                                onClick={toggleMenu}
                            >
                                Profile
                            </Link>
                            <button
                                onClick={() => { signOut(); toggleMenu(); }}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                                onClick={toggleMenu}
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                                onClick={toggleMenu}
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
