import { RequestConUsuario } from "../types";
import { Response, NextFunction } from "express";

export function checkRol(rolPermitido: string) {
  return (req: RequestConUsuario, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: "Usuario no autenticado" });
      return;
    }

    if (user.rol !== rolPermitido) {
      res.status(403).json({ error: "Acceso denegado: rol insuficiente" });
      return;
    }

    next();
  };
}
