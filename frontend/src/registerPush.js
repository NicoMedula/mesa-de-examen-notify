export async function registerPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permiso de notificaciones denegado');
      }
      // Aquí deberías obtener la VAPID public key desde tu backend
      const response = await fetch('http://localhost:3001/api/push/public-key');
      const { publicKey } = await response.json();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      console.log('Suscripción generada:', subscription);
      // Enviar la suscripción al backend
      const res = await fetch('http://localhost:3001/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      if (res.ok) {
        console.log('Suscripción enviada al backend:', subscription);
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