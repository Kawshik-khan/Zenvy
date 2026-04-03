// Zenvy Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Zenvy', body: event.data.text() };
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/next.svg',
    badge: '/next.svg',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.type || 'zenvy-notification',
    renotify: true,
    requireInteraction: data.type === 'incoming_call',
    data: {
      type: data.type,
      callerId: data.callerId,
      callerName: data.callerName,
      callerAvatar: data.callerAvatar,
      isVideo: data.isVideo,
      roomId: data.roomId,
      url: data.callerId
        ? `/chat/personal?id=${data.callerId}`
        : '/',
    },
    actions: data.type === 'incoming_call' ? [
      { action: 'answer', title: '📞 Answer' },
      { action: 'decline', title: '❌ Decline' },
    ] : [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Zenvy', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.url || '/';

  if (event.action === 'decline') {
    return;
  }

  // Focus existing tab or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to find an existing Zenvy tab and focus it
      for (const client of clientList) {
        if (client.url.includes('/chat') && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // No existing tab — open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Keep service worker alive
self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});
