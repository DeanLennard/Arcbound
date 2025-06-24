// components/PollsPanel.tsx
'use client';
import React, { useEffect, useState } from 'react';
import socket from '@/socket/socket';

export default function PollsPanel({ roomId }: { roomId: string }) {
    const [polls, setPolls] = useState<any[]>([]);

    useEffect(() => {
        socket.emit('fetchPolls', { roomId });
        socket.on('newPoll', (poll) => setPolls((p) => [...p, poll]));
        socket.on('pollUpdate', (updated) => {
            setPolls((p) => p.map((pl) => (pl._id === updated._id ? updated : pl)));
        });
        return () => {
            socket.off('newPoll');
            socket.off('pollUpdate');
        };
    }, [roomId]);

    const vote = (pollId: string, optionIndex: number) => {
        socket.emit('votePoll', { roomId, pollId, optionIndex });
    };

    return (
        <div className="bg-gray-700 bg-opacity-20 rounded p-2">
            <h3 className="font-semibold mb-2">Polls</h3>
            {polls.map((poll) => (
                <div key={poll._id} className="mb-2">
                    <p>{poll.question}</p>
                    <ul>
                        {poll.options.map((opt: any, idx: number) => (
                            <li key={idx} className="flex justify-between items-center">
                                <span>{opt.text}</span>
                                <button onClick={() => vote(poll._id, idx)} className="text-sm text-blue-500">
                                    Vote ({opt.voteCount})
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}