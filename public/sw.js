// public/sw.js
self.addEventListener('push', function(event) {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
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
