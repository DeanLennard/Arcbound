// /src/app/(dashboard)/layout.tsx

import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next'
import authOptions from "@/lib/authOptions";
import { redirect }          from 'next/navigation'

export default async function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
        // if not an admin, immediately kick them back to /
        redirect('/')
    }
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
                <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
                <nav className="flex flex-col gap-2">
                    <Link href="/admin" className="hover:underline">
                        Dashboard Home
                    </Link>
                    <Link href="/admin/phase" className="hover:underline">
                        Game Phase
                    </Link>
                    <Link href="/admin/users" className="hover:underline">
                        Manage Users
                    </Link>
                    <Link href="/admin/categories" className="hover:underline">
                        Manage Categories
                    </Link>
                    <Link href="/admin/posts" className="hover:underline">
                        Manage Posts
                    </Link>
                    <Link href="/admin/chats" className="hover:underline">
                        Manage Chats
                    </Link>
                    <Link href="/admin/arcships" className="hover:underline">
                        Manage Arcships
                    </Link>
                    <Link href="/admin/characters" className="hover:underline">
                        Manage Characters
                    </Link>
                    <Link href="/admin/sectors" className="hover:underline">
                        Manage Sectors
                    </Link>
                    <Link href="/admin/diplomacy" className="hover:underline">
                        Manage Diplomacy
                    </Link>
                    <Link href="/admin/reports" className="hover:underline">
                        Reports
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 bg-gray-900">
                {children}
            </main>
        </div>
    );
}
