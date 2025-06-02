// Versión del Service Worker - incrementar cuando se actualice
const SW_VERSION = '1.3.0';

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
  console.log('[Service Worker] Notificación push recibida', event);
  
  let data;
  try {
    if (event.data) {
      // Intentar parsear como JSON
      const text = event.data.text();
      console.log('[Service Worker] Datos brutos de notificación:', text);
      data = JSON.parse(text);
      console.log('[Service Worker] Datos de notificación parseados:', data);
    } else {
      console.warn('[Service Worker] No hay datos en el evento push');
      data = {};
    }
  } catch (e) {
    console.error('[Service Worker] Error al parsear datos de la notificación:', e);
    data = { title: 'Nueva notificación', body: 'No se pudieron procesar los detalles.' };
  }
  
  // Asegurarse de que todos los campos necesarios estén presentes
  const title = data.title || 'Nueva notificación';
  const options = {
    body: data.body || 'Tienes una nueva notificación.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'default-tag',
    data: data.url || '/',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    // Añadir un timestamp único para evitar que el navegador agrupe notificaciones similares
    timestamp: Date.now()
  };
  
  console.log('[Service Worker] Mostrando notificación con título:', title, 'y opciones:', options);
  
  event.waitUntil(
    // Promesa para mostrar la notificación
    self.registration.showNotification(title, options)
    .then(() => {
      console.log('[Service Worker] Notificación mostrada correctamente');
      // Enviar un mensaje a todas las ventanas de clientes para registrar el éxito
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_SHOWN',
            title: title,
            timestamp: Date.now()
          });
        });
      });
    })
    .catch(error => {
      console.error('[Service Worker] Error al mostrar notificación:', error);
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NOTIFICATION_ERROR',
            error: error.message
          });
        });
      });
    })
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