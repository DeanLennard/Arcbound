// public/sw.js
self.addEventListener('push', event => {
    event.waitUntil((async () => {
        let data = {}
        try { data = event.data.json() } catch (_) {}

        const summaryTag = 'chat-summary'
        // grab *all* notifications currently in scope (both summary & previous children)
        const existing = await self.registration.getNotifications()

        // count only the ones with YOUR summary tag
        const prevSummary = existing.find(n => n.tag === summaryTag)
        const prevCount   = prevSummary?.data?.count || 0
        const newCount    = prevCount + 1

        // 1) replace the old summary (or create it if missing)
        await self.registration.showNotification('Chat • Recent messages', {
            tag: summaryTag,           // fixed tag for your summary
            body: `You have ${newCount} new message${newCount>1?'s':''}`,
            renotify: true,
            data: { url: data.url, count: newCount },
            icon: data.icon || '/icon-192.png'
        })

        // 2) show the new “child” notification under its own unique tag
        await self.registration.showNotification(data.title, {
            tag: data.tag,
            body: data.body,
            data: { url: data.url },
            icon: data.icon || '/icon-192.png'
        })
    })())
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
