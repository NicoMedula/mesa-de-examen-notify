import { Router } from "express";
import { MesaController } from "../controllers/MesaController";
import { supabase } from "../config/supabase";
// import autenticarJWT from "../middleware/autenticacion"; // Not used currently

const router = Router();

router.get("/docente/:id/mesas", (req, res) => {
  // Forzar headers para asegurar respuesta JSON
  res.setHeader("Content-Type", "application/json");

  console.log(`Solicitud a /docente/${req.params.id}/mesas recibida`);

  // Protección contra errores de la ruta
  try {
    MesaController.getInstance().getMesasByDocenteId(req, res);
  } catch (error: any) {
    console.error("Error en ruta /docente/:id/mesas:", error);
    res.status(500).json({
      error: "Error al obtener mesas",
      detalle: error?.message || "Error desconocido",
    });
  }
});

router.post("/mesa/:mesaId/docente/:docenteId/confirmar", (req, res) =>
  MesaController.getInstance().confirmarMesa(req, res)
);

// Ruta para obtener todas las mesas - accesible para departamento y docentes
router.get("/mesas", (req, res) =>
  MesaController.getInstance().getAllMesas(req, res)
);

// Rutas de creación, actualización y eliminación - solo para departamento
router.post("/mesas", (req, res) =>
  MesaController.getInstance().createMesa(req, res)
);

router.put("/mesas/:mesaId", (req, res) =>
  MesaController.getInstance().updateMesa(req, res)
);

router.delete("/mesas/:mesaId", (req, res) =>
  MesaController.getInstance().deleteMesa(req, res)
);

router.get("/docentes", (req, res) => {
  // Forzar headers para asegurar respuesta JSON
  res.setHeader("Content-Type", "application/json");

  console.log("Solicitud a /docentes recibida");

  (async () => {
    try {
      console.log("Consultando perfiles de docentes en Supabase...");
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, nombre, role")
        .eq("role", "docente");

      if (error) {
        console.error("Error de Supabase al obtener docentes:", error);
        return res
          .status(500)
          .json({ error: error.message, origen: "supabase" });
      }

      console.log(
        `Encontrados ${data?.length || 0} docentes en la base de datos`
      );

      // Asegurar que estamos devolviendo un JSON válido incluso si data es null
      return res.status(200).json(data || []);
    } catch (err: any) {
      console.error("Error al obtener los docentes:", err);
      return res.status(500).json({
        error: "Error al obtener los docentes",
        detalle: err?.message || "Error desconocido",
        origen: "servidor",
      });
    }
  })();
});

export default router;
