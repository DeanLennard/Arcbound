// src/pages/api/socket.ts
import { Server as IOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/next';
import Message from '@/models/Message';
import MeetingRoom from "@/models/MeetingRoom";

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

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });

            socket.on('joinRoom', async ({ roomId }) => {
                // 1) join
                socket.join(roomId);

                // 2) increment DB counter
                await MeetingRoom.findByIdAndUpdate(roomId, { $inc: { participantCount: 1 } });

                // 3) grab *all* sockets in that room
                const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
                // emit **all** to the joining client (includes their own socket.id)
                socket.emit('allUsers', clients);

                // 4) tell *everyone else* that someone new just joined
                socket.to(roomId).emit('userJoined', { peerId: socket.id });
            });

            socket.on('getParticipants', ({ roomId }) => {
                // Grab the Set of socket IDs in that room (or an empty Set)
                const clients = io.sockets.adapter.rooms.get(roomId) || new Set<string>();
                // Convert to an array and emit back to the requester
                socket.emit('participantsList', Array.from(clients));
            });

            socket.on('offer', ({ to, sdp }) => {
                io.to(to).emit('offer', { from: socket.id, sdp });
            });

            socket.on('answer', ({ to, sdp }) => {
                io.to(to).emit('answer', { from: socket.id, sdp });
            });

            socket.on('ice-candidate', ({ to, candidate }) => {
                io.to(to).emit('ice-candidate', { from: socket.id, candidate });
            });

            socket.on('disconnecting', () => {
                // For each room this socket was in, tell the others it’s gone
                for (const roomId of socket.rooms) {
                    if (roomId === socket.id) continue;
                    socket.to(roomId).emit('userLeft', { peerId: socket.id });
                }
            });

            socket.on('leaveRoom', async ({ roomId }) => {
                socket.leave(roomId);
                await MeetingRoom.findByIdAndUpdate(roomId, { $inc: { participantCount: -1 } });
                socket.to(roomId).emit('userLeft', { peerId: socket.id });
            });
        });
    }
    res.end();
}
