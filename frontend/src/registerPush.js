export async function registerPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permiso de notificaciones denegado');
      }
      // Obtener el docenteId del almacenamiento
      const docenteId = sessionStorage.getItem('docenteId') || localStorage.getItem('docenteId');
      if (!docenteId) {
        throw new Error('No se encontró el ID del docente para registrar la suscripción push');
      }
      // Aquí deberías obtener la VAPID public key desde tu backend
      const API_URL = process.env.REACT_APP_API_URL;
      const response = await fetch(`${API_URL}/api/push/public-key`);
      const { publicKey } = await response.json();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      console.log('Suscripción generada:', subscription);
      // Enviar la suscripción y el docenteId al backend
      const res = await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docenteId, subscription })
      });
      if (res.ok) {
        console.log('Suscripción enviada al backend:', { docenteId, subscription });
      } else {
        console.error('Error al enviar la suscripción al backend:', await res.text());
      }
    } catch (error) {
      console.error('Error al registrar notificaciones push:', error);
    }
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
} 