import { Router } from 'express';
import { NotificacionController } from '../controllers/NotificacionController';
import { checkRol } from '../middleware/checkRol';

const router = Router();
const notificacionController = new NotificacionController();

// Rutas públicas para suscribirse a notificaciones push
router.get('/public-key', notificacionController.getPublicKey);
router.post('/subscribe', notificacionController.subscribe);
router.get('/diagnostico', notificacionController.diagnostico);

// Rutas protegidas para enviar notificaciones
router.post('/enviar', checkRol('admin'), notificacionController.enviarNotificacion);
router.post('/enviar-todos', checkRol('admin'), notificacionController.enviarNotificacionATodos);
router.post('/notificar-mesa', checkRol('admin'), notificacionController.notificarMesaExamen);

export default router;
