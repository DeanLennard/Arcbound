'use client';
import { useEffect } from 'react';

export default function PushButton() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const askPermission = async () => {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });

            // Send the subscription to your backend
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub),
            });
        };

        askPermission();
    }, []);

    return <button className="btn">Enable Notifications</button>;
}
