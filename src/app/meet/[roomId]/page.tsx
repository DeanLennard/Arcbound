// app/meet/[roomId]/page.tsx
'use client';
import { useRouter, useParams } from 'next/navigation';
import MeetingLayout from '@/components/MeetingLayout';
import socket from "@/socket/socket";

export default function MeetPage() {
    const { roomId } = useParams<{ roomId: string }>();
    const router = useRouter();

    function leaveRoom() {
        socket.emit('leaveRoom', roomId);
        router.push('/'); // back to your lobby/dashboard
    }

    return <MeetingLayout roomId={roomId} onLeave={leaveRoom} />;
}
