// src/pages/api/socket.ts
import { Server as IOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/next';
import Message from '@/models/Message';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    if (!res.socket.server.io) {
        console.log('Starting new Socket.io server...');
        const io = new IOServer(res.socket.server);
        res.socket.server.io = io;

        io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            socket.on('joinChat', (chatId) => {
                socket.join(chatId);
            });

            socket.on('sendMessage', async (message) => {
                try {
                    // Fetch the fully populated message
                    const populatedMessage = await Message.findById(message._id)
                        .populate('senderId', 'characterName profileImage')
                        .lean();

                    io.to(message.chatId).emit('newMessage', populatedMessage);
                } catch (err) {
                    console.error('Failed to populate message:', err);
                }
            });

            socket.on('typing', ({ chatId, userId }) => {
                socket.to(chatId).emit('typing', { chatId, userId });
            });

            socket.on('memberRemoved', ({ chatId, userId }) => {
                // send to everyone in that room
                io.to(chatId).emit('memberRemoved', { chatId, userId })
            })

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    }
    res.end();
}
