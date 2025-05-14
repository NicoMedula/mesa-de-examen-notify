"use strict";
// Middleware de autenticación y autorización con JWT para Express
// Protege rutas exigiendo un token JWT válido y validando roles permitidos
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware para autenticar y autorizar usuarios usando JWT.
 * @param rolesPermitidos - Arreglo de roles que pueden acceder a la ruta.
 * Uso: autenticarJWT(['docente', 'departamento'])
 */
function autenticarJWT(rolesPermitidos = []) {
    return (req, res, next) => {
        // El token debe enviarse en el header Authorization: Bearer <token>
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(" ")[1];
            // Verifica el token usando la clave secreta
            jsonwebtoken_1.default.verify(token, "TU_SECRETO", (err, usuario) => {
                if (err) {
                    // Token inválido o expirado
                    return res.status(403).json({ mensaje: "Token inválido o expirado" });
                }
                // Si se especifican roles, valida que el usuario tenga uno permitido
                if (rolesPermitidos.length > 0 &&
                    !rolesPermitidos.includes(usuario.rol)) {
                    return res
                        .status(403)
                        .json({ mensaje: "No tienes permisos suficientes" });
                }
                // Adjunta el usuario decodificado al request para su uso posterior
                req.usuario =
                    usuario;
                next();
            });
        }
        else {
            // No se proporcionó token
            res
                .status(401)
                .json({ mensaje: "No se proporcionó token de autenticación" });
        }
    };
}
exports.default = autenticarJWT;
