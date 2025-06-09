import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        redirect('/');  // or show a custom error page
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            {/* Admin content here */}
        </div>
    );
}
