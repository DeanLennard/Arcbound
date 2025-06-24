// src/app/(dashboard)/admin/meetings/create/page.tsx
'use client';
import MeetingRoomForm from '../MeetingRoomForm';
import { useRouter } from 'next/navigation';

export default function CreateMeetingPage() {
    const router = useRouter();

    const handleCreate = async (data: any) => {
        await fetch('/api/admin/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        router.push('/admin/meetings');
    };

    return (
        <div>
            <h1 className="text-2xl mb-4">Create New Meeting Room</h1>
            <MeetingRoomForm onSubmit={handleCreate} />
        </div>
    );
}
