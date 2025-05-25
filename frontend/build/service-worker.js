self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Nueva notificación';
  const options = {
    body: data.body || 'Tienes una nueva notificación.',
    icon: '/favicon.ico',
    data: data.url || '/'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
}); 