import request from "supertest";
import express from "express";
jest.mock("../controllers/MesaController");
jest.mock("../config/supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: [], error: null }),
  },
}));
import router from "./mesaRoutes";
import { MesaController } from "../controllers/MesaController";

describe("mesaRoutes", () => {
  const app = express();
  app.use(express.json());
  app.use(router);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /docente/:id/mesas responde 200", async () => {
    (MesaController.getInstance as jest.Mock).mockReturnValue({
      getMesasByDocenteId: (req, res) => res.status(200).json([]),
    });
    const res = await request(app).get("/docente/1/mesas");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /mesa/:mesaId/docente/:docenteId/confirmar responde 200", async () => {
    (MesaController.getInstance as jest.Mock).mockReturnValue({
      confirmarMesa: (req, res) => res.status(200).json({ ok: true }),
    });
    const res = await request(app).post("/mesa/1/docente/2/confirmar");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("GET /mesas responde 200", async () => {
    (MesaController.getInstance as jest.Mock).mockReturnValue({
      getAllMesas: (req, res) => res.status(200).json([]),
    });
    const res = await request(app).get("/mesas");
    expect(res.status).toBe(200);
  });

  it("POST /mesas responde 200", async () => {
    (MesaController.getInstance as jest.Mock).mockReturnValue({
      createMesa: (req, res) => res.status(200).json({ id: 1 }),
    });
    const res = await request(app).post("/mesas").send({});
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("PUT /mesas/:mesaId responde 200", async () => {
    (MesaController.getInstance as jest.Mock).mockReturnValue({
      updateMesa: (req, res) => res.status(200).json({ id: 1 }),
    });
    const res = await request(app).put("/mesas/1").send({});
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("DELETE /mesas/:mesaId responde 200", async () => {
    (MesaController.getInstance as jest.Mock).mockReturnValue({
      deleteMesa: (req, res) => res.status(200).json({ ok: true }),
    });
    const res = await request(app).delete("/mesas/1");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("GET /docentes responde 200", async () => {
    const res = await request(app).get("/docentes");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
