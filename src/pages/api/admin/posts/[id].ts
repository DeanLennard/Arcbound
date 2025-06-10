// src/pages/api/admin/posts/[id].ts
import { dbConnect } from '@/lib/mongodb';
import Post, { PostDocument } from '@/models/Post';
import type { NextApiRequest, NextApiResponse } from 'next';

// Define interfaces for populated fields
interface PopulatedCategory {
    _id: string;
    name: string;
}

interface PopulatedAuthor {
    _id: string;
    characterName: string;
    profileImage: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();

    const { id } = req.query;

    if (req.method === 'GET') {
        const post = await Post.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate<{ category: PopulatedCategory }>('category')
            .populate<{ authorId: PopulatedAuthor }>('authorId', 'characterName profileImage')
            .lean<PostDocument & { category: PopulatedCategory; authorId: PopulatedAuthor }>();

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;

        const { authorId, ...rest } = post;
        const transformedPost = {
            ...rest,
            likesCount,
            authorId: authorId?._id?.toString() || authorId?.toString() || '',
            author: authorId
                ? {
                    _id: authorId._id?.toString() || '',
                    characterName: authorId.characterName || 'Unknown',
                    profileImage: authorId.profileImage || null,
                }
                : { _id: '', characterName: 'Unknown', profileImage: null },
        };

        return res.status(200).json({ post: transformedPost });
    }

    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
