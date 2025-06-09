import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import { NextResponse } from 'next/server';

export async function requireRole(request: Request, allowedRoles: string[]) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!allowedRoles.includes(session.user.role)) {
        return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
    }
    return null; // means OK
}
