// Versión del Service Worker - incrementar cuando se actualice
const SW_VERSION = '1.2.0';

// Imprimir información del service worker para facilitar depuración
console.log('[Service Worker] Iniciando Service Worker v' + SW_VERSION);
console.log('[Service Worker] URL:', self.location.href);
console.log('[Service Worker] Scope:', self.registration?.scope || 'no scope');

// Evento de instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando Service Worker versión:', SW_VERSION);
  self.skipWaiting(); // Fuerza al nuevo SW a activarse inmediatamente
});

// Evento de activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Service Worker activado versión:', SW_VERSION);
  return self.clients.claim(); // Toma el control de todos los clientes inmediatamente
});

// Evento para manejar notificaciones push
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Notificación push recibida');
  
  let data;
  try {
    data = event.data ? event.data.json() : {};
    console.log('[Service Worker] Datos de notificación:', data);
  } catch (e) {
    console.error('[Service Worker] Error al parsear datos de la notificación:', e);
    data = {};
  }
  
  const title = data.title || 'Nueva notificación';
  const options = {
    body: data.body || 'Tienes una nueva notificación.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'default-tag',
    data: data.url || '/',
    actions: data.actions || [],
    requireInteraction: true,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
    .then(() => console.log('[Service Worker] Notificación mostrada correctamente'))
    .catch(error => console.error('[Service Worker] Error al mostrar notificación:', error))
  );
});

// Evento para manejar clics en las notificaciones
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notificación clickeada', event);
  
  event.notification.close();
  
  // Abrir la URL específica de la notificación o la raíz de la aplicación
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true})
    .then((windowClients) => {
      // Verificar si ya hay una ventana abierta con la URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ninguna ventana abierta, abre una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
    .catch(error => console.error('[Service Worker] Error al abrir ventana:', error))
  );
});

// Evento para manejar cuando se cierra una notificación
self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notificación cerrada', event);
});

// Mantener vivo el Service Worker
self.addEventListener('fetch', event => {
  // No hacemos nada especial con las solicitudes fetch,
  // solo mantenemos el service worker activo
});

console.log('[Service Worker] Service Worker cargado correctamente - Versión:', SW_VERSION); 