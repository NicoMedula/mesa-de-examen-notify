import express, { Request, Response } from 'express';
const router = express.Router();
import webpush from 'web-push';
import { PushNotificacionStrategy } from '../strategies/NotificacionStrategy';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'GENERAR_TU_CLAVE';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'GENERAR_TU_CLAVE_PRIVADA';

webpush.setVapidDetails(
  'mailto:admin@tusitio.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

router.get('/push/public-key', (req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post('/push/subscribe', (req: Request, res: Response) => {
  const subscription = req.body;
  console.log('Suscripción recibida:', JSON.stringify(subscription, null, 2));
  PushNotificacionStrategy.getInstance().addSubscription(subscription);
  res.status(201).json({ message: 'Suscripción registrada' });
});

export default router; 