import dotenv from "dotenv";
dotenv.config();

// Constantes de test seguras - no credenciales reales
const TEST_JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-for-unit-tests";
const MOCK_SECRET = "mock-secret-for-testing";

process.env.JWT_SECRET = TEST_JWT_SECRET;
import request from "supertest";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import autenticarJWT from "./autenticacion";

describe("autenticarJWT", () => {
  const app = express();
  app.use(express.json());

  // Usar variable de entorno para tests
  process.env.JWT_SECRET = MOCK_SECRET;

  app.get("/protegido", autenticarJWT(["admin"]), (req, res) => {
    res.json({ ok: true });
  });

  it("debería rechazar si no hay token", async () => {
    const res = await request(app).get("/protegido");
    expect(res.status).toBe(401);
  });

  it("debería rechazar si el token es inválido", async () => {
    const res = await request(app)
      .get("/protegido")
      .set("Authorization", "Bearer tokeninvalido");
    expect(res.status).toBe(403);
  });

  it("debería rechazar si el rol no es suficiente", async () => {
    const token = jwt.sign({ rol: "user" }, MOCK_SECRET);
    const res = await request(app)
      .get("/protegido")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("debería aceptar si el token y el rol son válidos", async () => {
    const token = jwt.sign({ rol: "admin" }, MOCK_SECRET);
    const res = await request(app)
      .get("/protegido")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("deniega acceso con token expirado", async () => {
    const token = jwt.sign({ rol: "docente", nombre: "Juan" }, SECRET, { expiresIn: '1ms' });
    // Esperamos 2ms para asegurar que el token expire
    await new Promise(resolve => setTimeout(resolve, 2));
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
  });

  it("deniega acceso con token que no tiene formato JWT válido", async () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
  });

  it("deniega acceso con token que no tiene campo rol", async () => {
    const token = jwt.sign({ nombre: "Juan" }, SECRET);
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("No tienes permisos suficientes");
  });

  it("deniega acceso con token que no es un objeto", async () => {
    const token = jwt.sign("string", SECRET);
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("No tienes permisos suficientes");
  });
});
