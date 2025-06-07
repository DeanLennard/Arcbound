// src/app/(dashboard)/admin/posts/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import PostsClient from './PostsClient'; // New component!

export default async function PostsPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        redirect('/');
    }

    return <PostsClient />;
}
