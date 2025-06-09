import { checkRol } from "./checkRol";

describe("checkRol", () => {
  const next = jest.fn();
  let res: any;

  beforeEach(() => {
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next.mockClear();
  });

  it("debería rechazar si no hay usuario", () => {
    const req = { user: undefined } as any;
    checkRol("admin")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario no autenticado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("debería rechazar si el rol es insuficiente", () => {
    const req = { user: { rol: "user" } } as any;
    checkRol("admin")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Acceso denegado: rol insuficiente",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("debería permitir si el rol es correcto", () => {
    const req = { user: { rol: "admin" } } as any;
    checkRol("admin")(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
