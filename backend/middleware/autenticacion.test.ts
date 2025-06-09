import dotenv from "dotenv";
dotenv.config();

const SECRET = process.env.JWT_SECRET || "test_secret";
process.env.JWT_SECRET = SECRET;
import request from "supertest";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import autenticarJWT from "./autenticacion";

describe("autenticarJWT", () => {
  const app = express();
  app.use(express.json());
  process.env.JWT_SECRET = "testsecret";

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
    const token = jwt.sign({ rol: "user" }, "testsecret");
    const res = await request(app)
      .get("/protegido")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("debería aceptar si el token y el rol son válidos", async () => {
    const token = jwt.sign({ rol: "admin" }, "testsecret");
    const res = await request(app)
      .get("/protegido")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
