import { Router } from "express";
import { MesaController } from "../controllers/MesaController";
import autenticarJWT from "../middleware/autenticacion";

const router = Router();
const mesaController = MesaController.getInstance();

router.get(
  "/docente/:id/mesas",
  autenticarJWT(["docente", "departamento"]),
  (req, res) => mesaController.getMesasByDocenteId(req, res)
);
router.post(
  "/mesa/:mesaId/docente/:docenteId/confirmar",
  autenticarJWT(["docente", "departamento"]),
  (req, res) => mesaController.confirmarMesa(req, res)
);
router.post(
  "/mesa/:mesaId/recordatorio",
  autenticarJWT(["docente", "departamento"]),
  (req, res) => mesaController.enviarRecordatorio(req, res)
);

export default router;
