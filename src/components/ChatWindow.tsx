// components/ChatWindow.tsx
'use client';
import React, { useEffect, useState } from 'react';
import socket from '@/socket/socket';

export default function ChatWindow({ roomId }: { roomId: string }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        socket.emit('fetchMessages', { roomId });
        socket.on('meetingMessage', (msg: any) => {
            setMessages((prev) => [...prev, msg]);
        });
        return () => { socket.off('meetingMessage'); };
    }, [roomId]);

    const sendMessage = () => {
        if (!input) return;
        socket.emit('sendMeetingMessage', { roomId, text: input });
        setInput('');
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-700 bg-opacity-20 rounded p-2">
            <div className="flex-1 overflow-auto mb-2">
                {messages.map((m, i) => (
                    <div key={i} className="py-1">
                        <strong>{m.senderName}:</strong> {m.payload.text}
                    </div>
                ))}
            </div>
            <div className="flex">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            const target = e.target as HTMLTextAreaElement;
                            setInput(target.value);
                            sendMessage();
                            e.preventDefault();
                        }
                    }}
                    rows={1}
                    className="flex-1 p-1 rounded bg-gray-500 text-white resize-y min-h-8 max-h-48"
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage} className="ml-2 px-3 py-1 bg-blue-600 rounded text-white">
                    Send
                </button>
            </div>
        </div>
    );
}