// src/pages/api/posts/[id]/comments.ts
import { dbConnect } from '@/lib/mongodb';
import Comment from '@/models/Comment';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextApiRequest, NextApiResponse } from 'next';
import Notification from '@/models/Notification';
import Post from '@/models/Post';
import mongoose from 'mongoose';

interface NestedComment {
    _id: string;
    likesCount: number;
    author: { characterName?: string; profileImage?: string };
    children: NestedComment[];
    [key: string]: any; // fallback for any additional properties
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const { id } = req.query; // postId

    if (req.method === 'POST') {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { content, parentId } = req.body;
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Comment content required' });
        }

        try {
            const comment = await Comment.create({
                postId: id,
                authorId: session.user.id,
                parentId: parentId || null,
                content: content.trim()
            });
            await comment.populate('authorId', 'characterName profileImage');

            // 🔔 Notification logic here:
            const post = await Post.findById(id).lean();
            if (post) {
                const recipients = new Set<string>();

                // Always notify post author if they aren't the one commenting
                if (post.authorId?.toString() !== session.user.id) {
                    recipients.add(post.authorId.toString());
                }

                // Notify subscribers, excluding the commenter
                if (post.subscribers) {
                    post.subscribers.forEach((subscriberId: mongoose.Types.ObjectId) => {
                        if (subscriberId.toString() !== session.user.id) {
                            recipients.add(subscriberId.toString());
                        }
                    });
                }

                // Create notifications
                await Promise.all(
                    Array.from(recipients).map(async (userId) => {
                        await Notification.create({
                            userId,
                            postId: post._id,
                            commentId: comment._id, // optional, if you want to reference the comment
                            type: 'comment',
                            isRead: false
                        });
                    })
                );
            }

            return res.status(201).json({
                comment: {
                    ...comment.toObject(),
                    author: {
                        characterName: comment.authorId.characterName,
                        profileImage: comment.authorId.profileImage
                    }
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to add comment' });
        }
    }
    else if (req.method === 'GET') {
        try {
            const comments = await Comment.find({ postId: id })
                .populate('authorId', 'characterName profileImage')
                .sort({ createdAt: 1 })
                .lean();

            // Nest replies under their parents
            const commentMap: Record<string, NestedComment> = {};
            comments.forEach(comment => {
                comment._id = comment._id.toString();
                comment.likesCount = comment.likes?.length || 0;
                comment.author = {
                    characterName: comment.authorId?.characterName,
                    profileImage: comment.authorId?.profileImage
                };
                comment.children = [];
                commentMap[comment._id] = comment;
            });

            const rootComments = [];
            comments.forEach(comment => {
                if (comment.parentId) {
                    commentMap[comment.parentId.toString()]?.children.push(comment);
                } else {
                    rootComments.push(comment);
                }
            });

            return res.status(200).json({ comments: rootComments });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to fetch comments' });
        }
    }
    else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
