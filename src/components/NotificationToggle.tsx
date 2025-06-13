'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const raw = window.atob(base64String + padding);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
        output[i] = raw.charCodeAt(i);
    }
    return output;
}

export default function NotificationToggle() {
    const [enabled, setEnabled] = useState<boolean | null>(null);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setEnabled(false);
            return;
        }
        navigator.serviceWorker.ready.then(reg =>
            reg.pushManager.getSubscription().then(sub =>
                setEnabled(!!sub)
            )
        );
    }, []);

    const toggle = async () => {
        const reg = await navigator.serviceWorker.register('/sw.js');
        if (enabled) {
            // unsubscribe
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await sub.unsubscribe();
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: sub.endpoint })
                });
            }
            setEnabled(false);
        } else {
            // subscribe
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Please allow notifications in your browser settings');
                return;
            }
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                )
            });
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub.toJSON())
            });
            setEnabled(true);
        }
    };

    if (enabled === null) return null;

    return (
        <button
            onClick={toggle}
            className="ml-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
            {enabled ? 'Disable Notifications' : 'Enable Notifications'}
        </button>
    );
}
