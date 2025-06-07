import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function GroupsPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        redirect('/');
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Manage Groups</h1>
            <p>Coming soon! Here you'll be able to create, edit, and delete groups.</p>
        </div>
    );
}
