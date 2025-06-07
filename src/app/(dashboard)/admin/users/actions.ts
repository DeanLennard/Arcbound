'use server';

import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

export async function getUsers() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        redirect('/');
    }

    await dbConnect();
    const users = await User.find().lean();
    return users.map((user) => ({
        _id: user._id.toString(),
        email: user.email,
        role: user.role
    }));
}
