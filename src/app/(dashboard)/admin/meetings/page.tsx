// src/app/(dashboard)/admin/meetings/page.tsx
'use client';
import useSWR from 'swr';
import Link from 'next/link';

interface MeetingRoom {
    _id: string;
    name: string;
    hostId: string;
    isLocked: boolean;
    participantCount: number;
    createdAt: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function MeetingList() {
    const { data: rooms, mutate } = useSWR<MeetingRoom[]>('/api/admin/meetings', fetcher);

    const toggleLock = async (id: string) => {
        await fetch(`/api/admin/meetings/${id}/lock`, { method: 'POST' });
        mutate();
    };

    return (
        <div>
            <header className="flex justify-between items-center mb-4">
                <h1 className="text-2xl">Manage Meeting Rooms</h1>
                <Link href="/admin/meetings/create" className="btn">Create Room</Link>
            </header>
            <table className="w-full table-auto">
                <thead>…</thead>
                <tbody>
                {rooms?.map((r) => (
                    <tr key={r._id}>
                        <td>{r.name}</td>
                        <td>{r.hostId}</td>
                        <td>{r.isLocked ? '🔒' : '🔓'}</td>
                        <td>{r.participantCount}</td>
                        <td>{new Date(r.createdAt).toLocaleString()}</td>
                        <td>
                            <Link href={`/admin/meetings/${r._id}`} className="btn-xs">Edit</Link>
                            <button onClick={() => toggleLock(r._id)} className="btn-xs ml-2">
                                {r.isLocked ? 'Unlock' : 'Lock'}
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
