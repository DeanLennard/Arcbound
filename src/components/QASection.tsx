// components/QASection.tsx
'use client';
import React, { useEffect, useState } from 'react';
import socket from '@/socket/socket';

export default function QASection({ roomId }: { roomId: string }) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [newQuestion, setNewQuestion] = useState('');

    useEffect(() => {
        socket.emit('fetchQuestions', { roomId });
        socket.on('newQuestion', (q) => setQuestions((qs) => [...qs, q]));
        socket.on('questionAnswered', ({ questionId }) => {
            setQuestions((qs) => qs.filter((q) => q._id !== questionId));
        });
        return () => {
            socket.off('newQuestion');
            socket.off('questionAnswered');
        };
    }, [roomId]);

    const ask = () => {
        if (!newQuestion) return;
        socket.emit('askQuestion', { roomId, text: newQuestion });
        setNewQuestion('');
    };

    return (
        <div className="bg-gray-700 bg-opacity-20 rounded p-2">
            <h3 className="font-semibold mb-2">Q&A</h3>
            <div className="mb-2">
                <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full p-1 rounded mb-1"
                />
                <button onClick={ask} className="px-3 py-1 bg-green-600 rounded text-white text-sm">
                    Ask
                </button>
            </div>
            <ul className="list-disc list-inside">
                {questions.map((q) => (
                    <li key={q._id}>{q.text}</li>
                ))}
            </ul>
        </div>
    );
}
