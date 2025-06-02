import express from "express";
import notificacionRoutes from './notificacionRoutes';
import mesaRoutes from './mesaRoutes';

const router = express.Router();

// Importar y usar todas las rutas
router.use('/api', mesaRoutes);
router.use('/api/push', notificacionRoutes);

// Ruta para probar si la API es accesible (para diagnóstico)
router.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

export default router;
