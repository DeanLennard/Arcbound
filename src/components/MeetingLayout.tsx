// components/MeetingLayout.tsx
'use client';
import React, {useEffect} from 'react';
import useSWR from 'swr';
import socket from '@/socket/socket';
import ChatWindow from '@/components/ChatWindow';
import VideoGrid from '@/components/VideoGrid';
import ParticipantsList from '@/components/ParticipantsList';
import PollsPanel from '@/components/PollsPanel';
import QASection from '@/components/QASection';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MeetingLayout({
                                          roomId,
                                          onLeave,
                                      }: {
    roomId: string;
    onLeave: () => void;
}) {

    // your joinRoom logic
    useEffect(() => {
        const onConnect = () => {
            socket.emit('joinRoom', { roomId });
        };
        socket.on('connect', onConnect);

        // initial join
        socket.emit('joinRoom', { roomId });

        return () => {
            socket.off('connect', onConnect);
            socket.emit('leaveRoom', { roomId });
        };
    }, [roomId]);

    const { data: room, error } = useSWR<{ name: string }>(
        `/api/admin/meetings/${roomId}`,
        fetcher
    );

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'You’re in a meeting—are you sure you want to leave?';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    if (error) return <p className="p-4 text-red-400">Failed to load room</p>;
    if (!room) return <p className="p-4">Loading room…</p>;

    return (
        <>
            <header className="flex justify-between items-center p-4 bg-black bg-opacity-50">
                <h1 className="text-white text-lg">Room: {room.name}</h1>
                <button onClick={onLeave} className="btn btn-danger">
                    Leave Meeting
                </button>
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* Video area */}
                <section className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
                    <VideoGrid roomId={roomId} />
                </section>

                {/* Sidebar: chat, participants, polls, Q&A */}
                <aside className="w-1/4 bg-gray-900 bg-opacity-10 p-2 flex flex-col space-y-4 overflow-auto">
                    <ChatWindow roomId={roomId} />
                    <ParticipantsList roomId={roomId} />
                    <PollsPanel roomId={roomId} />
                    <QASection roomId={roomId} />
                </aside>
            </main>
        </>
    );
}
