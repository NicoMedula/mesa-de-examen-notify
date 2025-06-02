import express, { Request, Response } from "express";
const router = express.Router();
import webpush from "web-push";
import { PushNotificacionStrategy } from "../strategies/NotificacionStrategy";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("Faltan las claves VAPID en las variables de entorno. No se podrán enviar notificaciones push.");
} else {
  console.log("Clave pública VAPID usada por el backend:", VAPID_PUBLIC_KEY);
  // Configuración detallada de VAPID para notificaciones push
  webpush.setVapidDetails(
    "mailto:admin@mesadeexamen.com",
    VAPID_PUBLIC_KEY as string,
    VAPID_PRIVATE_KEY as string
  );
}

router.get("/push/public-key", (req: Request, res: Response): void => {
  console.log("Solicitud de clave pública recibida");
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post("/push/subscribe", async (req: Request, res: Response): Promise<void> => {
  console.log("Solicitud de suscripción recibida");
  const { docenteId, subscription } = req.body;

  if (!docenteId || !subscription) {
    console.error("Datos de suscripción incompletos:", req.body);
    res.status(400).json({ error: "Datos de suscripción incompletos" });
    return;
  }

  console.log(
    "Suscripción recibida:",
    JSON.stringify({ docenteId, subscription }, null, 2)
  );

  try {
    await PushNotificacionStrategy.getInstance().addSubscription({
      docenteId,
      subscription,
    });
    console.log(
      "Suscripción registrada correctamente para el docente:",
      docenteId
    );
    res.status(201).json({ success: true, message: "Suscripción registrada correctamente" });
  } catch (error) {
    console.error("Error al registrar suscripción:", error);
    res.status(500).json({ error: "Error al registrar la suscripción" });
  }
});

router.delete("/push/unsubscribe", async (req: Request, res: Response): Promise<void> => {
  const { docenteId, endpoint } = req.body;

  if (!docenteId || !endpoint) {
    res.status(400).json({ error: "Se requiere docenteId y endpoint" });
    return;
  }

  try {
    await PushNotificacionStrategy.getInstance().removeSubscription(docenteId, endpoint);
    res.json({ success: true, message: "Suscripción eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar suscripción:", error);
    res.status(500).json({ error: "Error al eliminar la suscripción" });
  }
});

router.get("/push/subscriptions/:docenteId?", async (req: Request, res: Response): Promise<void> => {
  const { docenteId } = req.params;
  
  try {
    const subscriptions = PushNotificacionStrategy.getInstance().getActiveSubscriptions(docenteId);
    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error("Error al obtener suscripciones:", error);
    res.status(500).json({ error: "Error al obtener las suscripciones" });
  }
});

router.post("/push/cleanup", async (req: Request, res: Response): Promise<void> => {
  try {
    await PushNotificacionStrategy.getInstance().cleanupExpiredSubscriptions();
    res.json({ success: true, message: "Limpieza de suscripciones completada" });
  } catch (error) {
    console.error("Error al limpiar suscripciones:", error);
    res.status(500).json({ error: "Error al limpiar las suscripciones" });
  }
});

// Ruta para probar si la API es accesible (para diagnóstico)
router.get("/push/status", (req: Request, res: Response): void => {
  res.json({
    status: "online",
    vapidPublicKeyAvailable: !!VAPID_PUBLIC_KEY,
    timestamp: new Date().toISOString(),
  });
});

export default router;
