// public/sw.js

// Disable all fetch caching
self.addEventListener("fetch", (event) => {
    event.respondWith(fetch(event.request));
});

self.addEventListener('push', async event => {
    let data = {}
    try { data = event.data.json() } catch(_) {}

    const tag = 'chat-summary'
    const notes = await self.registration.getNotifications({ tag })
    const prevCount = notes[0]?.data?.count || 0
    const count = prevCount + 1

    event.waitUntil(
        self.registration.showNotification(
            `Chat • Recent messages`, {
                tag: tag,
                body: `You have ${count} new message${count>1?'s':''}`,
                renotify: true,
                data: { url: data.url, count: count },
                icon: data.icon || '/icon-192.png'
            }
        )
    )
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
