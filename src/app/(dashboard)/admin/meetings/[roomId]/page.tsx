// src/app/(dashboard)/admin/meetings/[roomId]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MeetingRoomForm from '../MeetingRoomForm';

interface RoomData {
    _id: string;
    name: string;
    hostId: string;
    coHostIds: string[];
    allowGuests: boolean;
    settings: { enableBreakouts: boolean; enableRecording: boolean; enablePolls: boolean; enableQA: boolean };
    scheduledStart?: string;
    durationMinutes?: number;
    isLocked: boolean;
}

export default function EditMeetingPage() {
    const router = useRouter();
    const params = useParams<{ roomId: string }>();
    if (!params?.roomId) {
        // you could render an error state or redirect
        return <p className="p-6 text-red-400">Invalid meeting ID</p>;
    }
    const roomId = params.roomId;

    const [room, setRoom] = useState<RoomData | null>(null);

    useEffect(() => {
        fetch(`/api/admin/meetings/${roomId}`)
            .then((r) => r.json())
            .then(setRoom);
    }, [roomId]);

    const handleSave = async (data: any) => {
        await fetch(`/api/admin/meetings/${roomId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        router.refresh();
    };

    const toggleLock = async () => {
        await fetch(`/api/admin/meetings/${roomId}/lock`, { method: 'POST' });
        router.refresh();
    };

    const handleDelete = async () => {
        if (!confirm('Really delete this room?')) return;
        await fetch(`/api/admin/meetings/${roomId}/delete`, { method: 'DELETE' });
        router.push('/admin/meetings');
    };

    if (!room) return <p>Loading…</p>;

    return (
        <div>
            <h1 className="text-2xl mb-4">Edit Meeting: {room.name}</h1>
            <div className="flex gap-2 mb-4">
                <button onClick={toggleLock} className="btn btn-sm">
                    {room.isLocked ? 'Unlock Room' : 'Lock Room'}
                </button>
                <button onClick={handleDelete} className="btn btn-sm btn-danger">
                    Delete Room
                </button>
            </div>

            <MeetingRoomForm initial={room} onSubmit={handleSave} />
        </div>
    );
}
