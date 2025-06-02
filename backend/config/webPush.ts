import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

// Las claves VAPID deben estar en variables de entorno para producción
// Si no existen, usamos claves predefinidas que coincidan con el frontend
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log('Usando claves VAPID predefinidas para desarrollo...');
  
  // Esta es la misma clave pública que está hardcodeada en el frontend (registerPush.js)
  process.env.VAPID_PUBLIC_KEY = 'BPaSiaEDBPZ5-sxFuEeJvaheaqSDwlIRJZqdUVycYeycUBuVVM4LjLFa6YbRL3uaipiTm7ykE2eRbn0dtG7Vdbg';
  // Esta clave privada debe coincidir con la pública anterior
  process.env.VAPID_PRIVATE_KEY = 'hzVE2H0uKNdMpkKmKXlFDYYr6lH6_2e7GQrC2Vx6XnE';
  
  console.log('Usando claves VAPID predefinidas:');
  console.log('Public Key:', process.env.VAPID_PUBLIC_KEY);
  console.log('Private Key:', process.env.VAPID_PRIVATE_KEY);
  console.log('NOTA: Estas claves son para desarrollo, cámbialas en producción');
}

// Configurar web-push con las claves VAPID
webpush.setVapidDetails(
  'mailto:contacto@universidad.edu.ar', // Cambiar por un email real
  process.env.VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export const getVapidPublicKey = (): string => {
  return process.env.VAPID_PUBLIC_KEY as string;
};

export default webpush;
