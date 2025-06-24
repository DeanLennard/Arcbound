// src/components/VideoGrid.tsx
'use client';
import { useWebRTC } from '@/hooks/useWebRTC';

export default function VideoGrid({ roomId }: { roomId: string }) {
    const { localVideoRef, peers } = useWebRTC(roomId);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {/* Local video */}
            <video
                ref={localVideoRef}
                muted
                autoPlay
                playsInline
                className="rounded-lg shadow-lg"
            />

            {/* Remote peers */}
            {peers.map(({ peerId, stream }) => (
                <video
                    key={peerId}
                    ref={(el) => {
                        if (el) el.srcObject = stream;
                    }}
                    autoPlay
                    playsInline
                    className="rounded-lg shadow-lg"
                />
            ))}
        </div>
    );
}
