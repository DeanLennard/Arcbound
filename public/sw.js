// public/sw.js

// 2) Push event (no tag/grouping yet)
self.addEventListener('push', event => {
    const data = event.data.json();
    const title = data.title || '🔔 New notification';
    const options = {
        body: data.body || '',
        icon: data.icon || '/icon-192.png',
        data: { url: data.url || '/' },
        tag:      data.tag,
        renotify: true,
    };
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/'; // fallback to homepage

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (const client of clientList) {
                // If the page is already open, focus it
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
