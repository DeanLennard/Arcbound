// components/ParticipantsList.tsx
'use client';
import React, { useEffect, useState } from 'react';
import socket from '@/socket/socket';

export default function ParticipantsList({ roomId }) {
    const [participants, setParticipants] = useState<string[]>([]);

    useEffect(() => {
        socket.on('allUsers', (list: string[]) => {
            // Turn it into a Set and back to an array
            setParticipants(Array.from(new Set(list)));
        });
        socket.on('userJoined', ({ peerId }) => {
            setParticipants((prev) => {
                const s = new Set(prev);
                s.add(peerId);
                return Array.from(s);
            });
        });
        socket.on('userLeft', ({ peerId }) => {
            setParticipants((prev) => prev.filter((id) => id !== peerId));
        });
        return () => {
            socket.off('allUsers');
            socket.off('userJoined');
            socket.off('userLeft');
        };
    }, [roomId]);

    return (
        <div className="bg-gray-700 bg-opacity-20 rounded p-2">
            <h3 className="font-semibold mb-2">Participants</h3>
            <ul className="list-disc list-inside">
                {participants.map((id) => (
                    <li key={id}>{id}</li>
                ))}
            </ul>
        </div>
    );
}
