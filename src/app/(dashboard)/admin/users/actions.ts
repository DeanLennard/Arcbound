'use server';

import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import authOptions from '@/lib/authOptions';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import mongoose from 'mongoose';

export async function getUsers() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        redirect('/');
    }

    await dbConnect();
    const users = await User.find().lean();
    return users.map((user) => ({
        _id: (user._id as mongoose.Types.ObjectId).toString(),
        email: user.email,
        role: user.role
    }));
}
