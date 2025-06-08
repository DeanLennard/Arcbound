// /src/pages/api/posts/[id]/like.ts
import { dbConnect } from '@/lib/mongodb';
import Post from '@/models/Post';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextApiRequest, NextApiResponse } from 'next';
import Notification from '@/models/Notification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const { id } = req.query;

    if (req.method === 'POST') {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        try {
            // Ensure the likes field is always an array
            await Post.updateMany(
                { likes: { $exists: true, $not: { $type: 'array' } } },
                { $set: { likes: [] } }
            );

            const post = await Post.findById(id);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            if (!Array.isArray(post.likes)) {
                post.likes = [];
            }

            const userId = session.user.id;
            const hasLiked = post.likes.includes(userId);

            if (hasLiked) {
                // Unlike
                post.likes = post.likes.filter((uid) => uid !== userId);
            } else {
                // Like
                post.likes.push(userId);
                await Notification.create({
                    userId: subscriberId,
                    postId: post._id,
                    type: 'like', // or 'comment'
                });
            }

            await post.save();

            return res.status(200).json({ likes: (Array.isArray(post.likes) ? post.likes : []).length });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to like/unlike post' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
