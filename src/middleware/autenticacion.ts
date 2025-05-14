// Middleware de autenticación y autorización con JWT para Express
// Protege rutas exigiendo un token JWT válido y validando roles permitidos

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Tipo para los roles permitidos
// Puedes modificar este tipo según los roles de tu sistema
type RolPermitido = string;

// Interfaz para el payload esperado en el JWT
// Debe incluir al menos el campo 'rol'
interface UsuarioJWT {
  rol: string;
  [key: string]: unknown;
}

/**
 * Middleware para autenticar y autorizar usuarios usando JWT.
 * @param rolesPermitidos - Arreglo de roles que pueden acceder a la ruta.
 * Uso: autenticarJWT(['docente', 'departamento'])
 */
function autenticarJWT(rolesPermitidos: RolPermitido[] = []) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // El token debe enviarse en el header Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        "JWT_SECRET no está definido en las variables de entorno"
      );
    }
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      // Verifica el token usando la clave secreta
      jwt.verify(token, secret, (err, usuario: unknown) => {
        if (err) {
          // Token inválido o expirado
          return res.status(403).json({ mensaje: "Token inválido o expirado" });
        }
        // Si se especifican roles, valida que el usuario tenga uno permitido
        if (
          rolesPermitidos.length > 0 &&
          !rolesPermitidos.includes((usuario as UsuarioJWT).rol)
        ) {
          return res
            .status(403)
            .json({ mensaje: "No tienes permisos suficientes" });
        }
        // Adjunta el usuario decodificado al request para su uso posterior
        (req as unknown as { usuario: UsuarioJWT }).usuario =
          usuario as UsuarioJWT;
        next();
      });
    } else {
      // No se proporcionó token
      res
        .status(401)
        .json({ mensaje: "No se proporcionó token de autenticación" });
    }
  };
}

export default autenticarJWT;
