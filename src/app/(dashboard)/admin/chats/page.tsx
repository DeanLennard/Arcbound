// src/app/(dashboard)/admin/chats/page.tsx
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import ChatsPageClient from './ChatsPageClient';  // New client component

export default async function ChatsPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        redirect('/');
    }

    return <ChatsPageClient />;
}
