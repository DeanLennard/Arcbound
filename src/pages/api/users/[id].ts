// /src/pages/api/users/[id].ts
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const user = await User.findById(params.id).lean();
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    const { id } = req.query;

    if (req.method === 'PUT') {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        try {
            if (session.user.id !== id) {
                return res.status(403).json({ error: 'You can only edit your own profile' });
            }

            const { playerName, characterName, profileImage } = req.body;
            const updatedUser = await User.findByIdAndUpdate(
                id,
                { playerName, characterName, profileImage },
                { new: true }
            ).lean();

            const { password: _, ...safeUser } = updatedUser;
            return res.status(200).json({ user: safeUser });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
