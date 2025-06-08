// /src/pages/api/chats/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { dbConnect } from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { requireAuth } from '@/lib/auth';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const session = await requireAuth(req, res);
    if (!session) return;

    if (req.method === 'POST') {
        const { memberIds, isGroup, groupName, groupImage } = req.body;

        if (!memberIds || memberIds.length < 1) {
            return res.status(400).json({ error: 'Please provide memberIds' });
        }

        try {
            if (!isGroup && memberIds.length === 1) {
                // Direct (1-on-1) chat
                const existingChat = await Chat.findOne({
                    isGroup: false,
                    members: { $all: [session.user.id, memberIds[0]], $size: 2 }
                }).lean();

                if (existingChat) {
                    return res.status(200).json({ chat: existingChat });
                }
            }

            // Create new chat
            const chat = await Chat.create({
                isGroup: isGroup || false,
                members: [session.user.id, ...memberIds],
                groupName,
                groupImage
            });

            res.status(201).json({ chat });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to create chat' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
