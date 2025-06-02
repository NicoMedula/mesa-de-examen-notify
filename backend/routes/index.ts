import express, { Request, Response } from "express";
const router = express.Router();
import webpush from "web-push";
import { PushNotificacionStrategy } from "../strategies/NotificacionStrategy";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "GENERAR_TU_CLAVE";
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "GENERAR_TU_CLAVE_PRIVADA";

// Configuración detallada de VAPID para notificaciones push
webpush.setVapidDetails(
  "mailto:admin@mesadeexamen.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

router.get("/push/public-key", (req: Request, res: Response): void => {
  console.log("Solicitud de clave pública recibida");
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post("/push/subscribe", (req: Request, res: Response): void => {
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
    PushNotificacionStrategy.getInstance().addSubscription({
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

// Ruta para probar si la API es accesible (para diagnóstico)
router.get("/push/status", (req: Request, res: Response): void => {
  res.json({
    status: "online",
    vapidPublicKeyAvailable: !!VAPID_PUBLIC_KEY,
    timestamp: new Date().toISOString(),
  });
});

export default router;
