// src/pages/api/admin/posts/[id].ts
import { dbConnect } from '@/lib/mongodb';
import Post from '@/models/Post';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    const { id } = req.query;

    if (req.method === 'GET') {
        const post = await Post.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate('category')
            .populate('authorId', 'characterName profileImage')
            .lean();

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
        post.likesCount = likesCount;

        const transformedPost = {
            ...post,
            author: post.authorId
                ? {
                    characterName: post.authorId.characterName || 'Unknown',
                    profileImage: post.authorId.profileImage || null
                }
                : { characterName: 'Unknown', profileImage: null }
        };

        delete transformedPost.authorId;

        return res.status(200).json({ post: transformedPost });
    }

    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
