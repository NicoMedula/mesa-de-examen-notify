import { Request, Response } from "express";
import { supabase } from "../config/supabase";

export class AuthController {
  /**
   * Solicita un restablecimiento de contraseña
   * Este método envía un correo con un enlace para restablecer la contraseña
   */
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "El email es requerido" });
      return;
    }

    try {
      // Verificar si estamos en modo desarrollo (para no enviar correos reales)
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      if (isDevelopment) {
        // En modo desarrollo, generar un token de prueba y mostrarlo en la consola
        // en lugar de enviar un correo real
        const mockToken = `test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        console.log('===== MODO DE PRUEBA =====');
        console.log(`Email solicitado: ${email}`);
        console.log(`Token de restablecimiento: ${mockToken}`);
        console.log(`URL de restablecimiento: http://172.17.3.14:3000/reset-password?token=${mockToken}`);
        console.log('=========================');
        
        // Devolver una respuesta exitosa con información para pruebas
        res.status(200).json({ 
          message: "MODO DE PRUEBA: Revisa la consola del servidor para ver el token de restablecimiento",
          // Solo incluir el token en desarrollo para facilitar las pruebas
          testToken: mockToken
        });
        return;
      }
      
      // En producción, usar el flujo normal con Supabase para enviar correos reales
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
      });

      if (error) {
        console.error("Error al solicitar restablecimiento:", error);
        res.status(400).json({ error: error.message });
        return;
      }

      // Por seguridad, siempre devolvemos éxito incluso si el email no existe
      // para no dar información sobre qué emails están registrados
      res.status(200).json({ 
        message: "Si el correo existe, recibirá un enlace para restablecer su contraseña" 
      });

    } catch (error: any) {
      console.error("Error en recuperación de contraseña:", error);
      res.status(500).json({ error: "Error al procesar la solicitud" });
    }
  }

  /**
   * Actualiza la contraseña usando el token proporcionado
   */
  static async updatePassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: "Token y contraseña son requeridos" });
      return;
    }

    try {
      // Verificar si estamos en modo desarrollo (para no requerir autenticación)
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      if (isDevelopment) {
        // En modo desarrollo, vamos a simular el cambio de contraseña sin requerir una sesión
        // Verificamos si el token empieza con 'test_' (nuestro prefijo de tokens de prueba)
        if (token.startsWith('test_')) {
          console.log('===== MODO DE PRUEBA =====');
          console.log(`Simulando cambio de contraseña con token: ${token}`);
          console.log(`Nueva contraseña (simulada): ${password.substring(0, 2)}${'*'.repeat(password.length - 2)}`);
          console.log('=========================');
          
          // Simular éxito en modo de prueba
          res.status(200).json({ 
            message: "MODO DE PRUEBA: Contraseña actualizada correctamente (simulado)" 
          });
          return;
        } else {
          // Si no es un token de prueba, devolver error
          res.status(400).json({ error: "Token de prueba inválido. Debe empezar con 'test_'" });
          return;
        }
      }
      
      // En producción, usar el flujo normal con Supabase
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error("Error al actualizar contraseña:", error);
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(200).json({ 
        message: "Contraseña actualizada correctamente" 
      });
      
    } catch (error: any) {
      console.error("Error en actualización de contraseña:", error);
      res.status(500).json({ error: "Error al procesar la solicitud" });
    }
  }
}
