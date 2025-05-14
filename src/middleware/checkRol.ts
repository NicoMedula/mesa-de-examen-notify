import { Response, NextFunction } from "express";
import { RequestConUsuario } from "../types";

export function checkRol(rolPermitido: string) {
  return (req: RequestConUsuario, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (user.rol !== rolPermitido) {
      return res.status(403).json({ error: "Acceso denegado: rol insuficiente" });
    }

    next();
  };
}
