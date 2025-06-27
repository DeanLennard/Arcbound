import { dbConnect } from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';

interface Liker { characterName: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const { id } = req.query; // commentId

    if (req.method === 'GET') {
        const comment = await Comment
            .findById(id)
            .populate<{ likes: any }>('likes', 'characterName');
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const likers = comment.likes.map((u: any) => u.characterName);
        return res.json({ count: likers.length, likers });
    }

    if (req.method === 'POST') {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        try {
            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({ error: 'Comment not found' });
            }

            const userId = session.user.id;
            const hasLiked = comment.likes.includes(userId);

            if (hasLiked) {
                comment.likes = comment.likes.filter((uid: mongoose.Types.ObjectId) => uid.toString() !== userId);
            } else {
                comment.likes.push(userId);
            }

            await comment.save();
            return res.status(200).json({ likes: comment.likes.length });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to like/unlike comment' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
