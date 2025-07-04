// public/sw.js
self.addEventListener('push', function(event) {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        data: {
            url: data.url || '/'
        },
        tag:  data.tag,
        group: 'chat-messages',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('push', async event => {
    let data = {};
    try { data = event.data.json() } catch(_) {}

    const groupKey = 'chat-messages';

    // 1) Look at all current notifications in this group:
    const existing = await self.registration.getNotifications({ tag: groupKey });

    // 2) Figure out the new total count:
    const newCount = existing.length + 1;

    // 3) Show (or replace) the summary notification:
    const summaryOptions = {
        body: `You have ${newCount} new message${newCount > 1 ? 's' : ''}`,
        tag:   groupKey,           // always the same tag for the summary
        renotify: true,            // ensures the user sees updates
        data: { url: data.url },
        icon: data.icon || '/icon-192.png',
    };
    event.waitUntil(self.registration.showNotification(
        'Chat • Recent messages',
        summaryOptions
    ));

    // 4) Show the individual message “child” notification:
    const childOptions = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        tag:   data.tag,
        group: groupKey,
        data:  { url: data.url },
    };
    event.waitUntil(self.registration.showNotification(
        data.title,
        childOptions
    ));
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
