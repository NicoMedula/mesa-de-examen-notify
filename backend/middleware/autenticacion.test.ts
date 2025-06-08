import dotenv from "dotenv";
dotenv.config();

const SECRET = process.env.JWT_SECRET || "test_secret";
process.env.JWT_SECRET = SECRET;
import request from "supertest";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import autenticarJWT from "./autenticacion";

// Crea una app de Express para pruebas
const app = express();
app.use(express.json());

// Ruta protegida solo para roles 'docente' y 'departamento'
app.get(
  "/protegida",
  autenticarJWT(["docente", "departamento"]),
  (req: Request, res: Response) => {
    res.json({
      mensaje: "Acceso concedido",
      usuario: (req as unknown as { usuario: { rol: string; nombre: string } })
        .usuario,
    });
  }
);

// Ruta sin restricción de roles
app.get("/sin-roles", autenticarJWT(), (req: Request, res: Response) => {
  res.json({
    mensaje: "Acceso concedido sin verificar rol",
    usuario: (req as unknown as { usuario: { rol: string; nombre: string } })
      .usuario,
  });
});

describe("Middleware autenticarJWT", () => {
  it("permite acceso con token válido y rol permitido", async () => {
    const token = jwt.sign({ rol: "docente", nombre: "Juan" }, SECRET);
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe("Acceso concedido");
    expect(res.body.usuario.rol).toBe("docente");
  });

  it("permite acceso con token válido cuando no se especifican roles", async () => {
    const token = jwt.sign({ rol: "cualquier_rol", nombre: "Juan" }, SECRET);
    const res = await request(app)
      .get("/sin-roles")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe("Acceso concedido sin verificar rol");
  });

  it("deniega acceso con token válido pero rol NO permitido", async () => {
    const token = jwt.sign({ rol: "alumno", nombre: "Pedro" }, SECRET);
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("No tienes permisos suficientes");
  });

  it("deniega acceso con token inválido", async () => {
    const token = "token_invalido";
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
  });

  it("deniega acceso si no se envía token", async () => {
    const res = await request(app).get("/protegida");
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toBe("No se proporcionó token de autenticación");
  });

  it("lanza error si JWT_SECRET no está definida", async () => {
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    // Se debe crear una app nueva para evitar interferencias
    const appSinSecret = express();
    appSinSecret.get("/protegida", (req, res, next) => {
      try {
        autenticarJWT(["docente"])(req, res, next);
      } catch (e) {
        res.status(500).json({ mensaje: (e as Error).message });
      }
    });
    const res = await request(appSinSecret).get("/protegida");
    expect(res.status).toBe(500);
    expect(res.body.mensaje).toMatch(/JWT_SECRET no está definido/);
    process.env.JWT_SECRET = originalSecret;
  });

  it("deniega acceso si el header Authorization es 'Bearer' sin token", async () => {
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", "Bearer");
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
  });

  it("deniega acceso si el header Authorization es 'Bearer ' (con espacio pero sin token)", async () => {
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", "Bearer ");
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
  });

  it("deniega acceso si el header Authorization es 'Bearer token extra' (más de dos partes)", async () => {
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", "Bearer token extra");
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
  });

  it("deniega acceso si el header Authorization no empieza con 'Bearer'", async () => {
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", "Token abcdef");
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
  });

  it("deniega acceso si el header Authorization no tiene formato Bearer <token>", async () => {
    const res = await request(app)
      .get("/protegida")
      .set("Authorization", "TokenSinBearer");
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe("Token inválido o expirado");
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
