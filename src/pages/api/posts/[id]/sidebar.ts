// src/pages/api/posts/[id]/sidebar.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';

interface PostWithViews {
    views?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (req.method === 'GET') {
        try {
            await dbConnect();
            const post = await Post.findById(id).lean() as PostWithViews;

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const commentsCount = await Comment.countDocuments({ postId: id });

            return res.status(200).json({
                views: post.views ?? 0,
                commentsCount,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to fetch sidebar data' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
