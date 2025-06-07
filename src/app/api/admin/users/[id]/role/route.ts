import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const userId = params.id;
    const { newRole } = await req.json();

    if (!['admin', 'moderator', 'member'].includes(newRole)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.role = newRole;
    await user.save();

    return NextResponse.json({ message: 'User role updated successfully' }, { status: 200 });
}
