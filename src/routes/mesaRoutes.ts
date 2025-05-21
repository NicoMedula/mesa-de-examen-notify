import { Router } from "express";
import { MesaController } from "../controllers/MesaController";
import { supabase } from "../config/supabase";
import autenticarJWT from "../middleware/autenticacion";

const router = Router();
const mesaController = MesaController.getInstance();

router.get("/docente/:id/mesas", autenticarJWT(["departamento", "docente"]), (req, res) =>
  mesaController.getMesasByDocenteId(req, res)
);

router.post(
  "/mesa/:mesaId/docente/:docenteId/confirmar",
  autenticarJWT(["departamento", "docente"]),
  (req, res) => mesaController.confirmarMesa(req, res)
);

router.post(
  "/mesa/:mesaId/recordatorio",
  autenticarJWT(["departamento"]),
  (req, res) => mesaController.enviarRecordatorio(req, res)
);

// Ruta para obtener todas las mesas - accesible para departamento y docentes
router.get("/mesas", autenticarJWT(["departamento", "docente"]), (req, res) => 
  mesaController.getAllMesas(req, res)
);

// Rutas de creación, actualización y eliminación - solo para departamento
router.post("/mesas", autenticarJWT(["departamento"]), (req, res) => 
  mesaController.createMesa(req, res)
);

router.put("/mesas/:mesaId", autenticarJWT(["departamento"]), (req, res) => 
  mesaController.updateMesa(req, res)
);

router.delete("/mesas/:mesaId", autenticarJWT(["departamento"]), (req, res) =>
  mesaController.deleteMesa(req, res)
);

router.get("/docentes", autenticarJWT(["departamento", "docente"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, nombre, role")
      .eq("role", "docente");
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los docentes" });
  }
});

export default router;
