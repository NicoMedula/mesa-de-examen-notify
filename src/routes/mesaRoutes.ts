import { Router } from "express";
import { MesaController } from "../controllers/MesaController";

const router = Router();
const mesaController = MesaController.getInstance();

router.get("/docente/:id/mesas", (req, res) =>
  mesaController.getMesasByDocenteId(req, res)
);
router.post("/mesa/:mesaId/docente/:docenteId/confirmar", (req, res) =>
  mesaController.confirmarMesa(req, res)
);
router.post("/mesa/:mesaId/recordatorio", (req, res) =>
  mesaController.enviarRecordatorio(req, res)
);

export default router;
