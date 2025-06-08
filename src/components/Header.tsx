'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { BellIcon, Menu, X } from 'lucide-react';

export default function Header() {
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (session) {
            fetch('/api/notifications/unread-count')
                .then(res => res.json())
                .then(data => setUnreadCount(data.unreadCount || 0))
                .catch(err => console.error('Failed to fetch unread count:', err));
        }
    }, [session]);

    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <header className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center relative">
            {/* Left: Logo and nav links (desktop) */}
            <div className="flex items-center gap-4">
                <Link href="/" className="text-xl font-bold hover:underline">
                    Arcbound
                </Link>
                <nav className="hidden md:flex items-center gap-4">
                    <Link href="/forum" className="hover:underline">
                        Relay
                    </Link>
                    <Link href="/tools" className="hover:underline">
                        Tools
                    </Link>
                </nav>
            </div>

            {/* Right: User links */}
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
                        <Link
                            href={`/profile/${session.user.id}`}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded hidden md:inline"
                        >
                            Profile
                        </Link>
                        <button
                            onClick={() => signOut()}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded hidden md:inline"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            href="/login"
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded hidden md:inline"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded hidden md:inline"
                        >
                            Register
                        </Link>
                    </>
                )}

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden text-white"
                    aria-label="Menu"
                >
                    {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {menuOpen && (
                <div className="absolute top-full left-0 w-full bg-gray-900 text-white flex flex-col gap-2 px-4 py-3 z-50">
                    <Link href="/forum" className="hover:underline" onClick={toggleMenu}>
                        Relay
                    </Link>
                    <Link href="/tools" className="hover:underline" onClick={toggleMenu}>
                        Tools
                    </Link>
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
                                onClick={() => {
                                    signOut();
                                    toggleMenu();
                                }}
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
                                onClick={toggleMenu}
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
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
