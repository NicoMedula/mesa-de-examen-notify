import { Router } from "express";
import { MesaController } from "../controllers/MesaController";
import { supabase } from "../config/supabase";

const router = Router();
const mesaController = MesaController.getInstance();

router.get("/docente/:id/mesas", (req, res) =>
  mesaController.getMesasByDocenteId(req, res)
);
// Versión protegida:
// router.get("/docente/:id/mesas", autenticarJWT(["departamento"]), (req, res) =>
//   mesaController.getMesasByDocenteId(req, res)
// );

router.post("/mesa/:mesaId/docente/:docenteId/confirmar", (req, res) =>
  mesaController.confirmarMesa(req, res)
);
// Versión protegida:
// router.post(
//   "/mesa/:mesaId/docente/:docenteId/confirmar",
//   autenticarJWT(["departamento"]),
//   (req, res) => mesaController.confirmarMesa(req, res)
// );

router.post("/mesa/:mesaId/recordatorio", (req, res) =>
  mesaController.enviarRecordatorio(req, res)
);
// Versión protegida:
// router.post(
//   "/mesa/:mesaId/recordatorio",
//   autenticarJWT(["departamento"]),
//   (req, res) => mesaController.enviarRecordatorio(req, res)
// );

router.get("/mesas", (req, res) => mesaController.getAllMesas(req, res));
router.post("/mesas", (req, res) => mesaController.createMesa(req, res));
router.put("/mesas/:mesaId", (req, res) => mesaController.updateMesa(req, res));
router.delete("/mesas/:mesaId", (req, res) =>
  mesaController.deleteMesa(req, res)
);

router.get("/docentes", async (req, res) => {
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
