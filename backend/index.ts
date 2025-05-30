import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import mesaRoutes from "./routes/mesaRoutes";
import { WebSocketNotificacionStrategy } from "./strategies/NotificacionStrategy";
import { supabase } from "./config/supabase";
import { AuthController } from "./controllers/AuthController";
import pushRoutes from "./routes/index";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware de logging para depuración
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configuración de CORS mejorada
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3003", "https://mesa-de-examen-notify-seven.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    credentials: true,
  })
);

// Procesar datos JSON
app.use(express.json());

// Importante: Primero definimos las rutas API antes de cualquier middleware de servicio de archivos estáticos
// para evitar que las rutas API devuelvan HTML en lugar de JSON

// Configuración de WebSocket
const wsStrategy = WebSocketNotificacionStrategy.getInstance();
wsStrategy.setSocketIO(io);

// API ROUTES - Deben definirse primero para que tengan prioridad
// Definir explícitamente el tipo de contenido para todas las rutas API
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  // Forzar el tipo de contenido JSON para todas las respuestas API
  res.setHeader("Content-Type", "application/json");
  next();
});

// Rutas de API
app.use("/api", mesaRoutes);
app.use("/api", pushRoutes);

// Rutas de autenticación y login
app.post("/api/reset-password", AuthController.requestPasswordReset);
app.post("/api/update-password", AuthController.updatePassword);
app.post("/api/login", async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  console.log(`Intento de login - Email: ${email}, Rol: ${role}`);

  try {
    // Caso especial para el rol de departamento (bypass para facilitar el desarrollo)
    if (email === "departamento@ejemplo.com" && role === "departamento") {
      console.log("Usando acceso directo para departamento");

      // Buscar el usuario en la tabla profiles para obtener su ID
      const { data: depProfile, error: depProfileError } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("email", email)
        .single();

      if (depProfileError || !depProfile) {
        console.log("Departamento no encontrado en profiles, usando ID fijo");
        // Si no se encuentra en la BD, usar datos fijos para desarrollo
        res.json({
          user: {
            id: "b8f96d66-9f9a-43dd-92f8-0010-departamento",
            email: "departamento@ejemplo.com",
          },
          role: "departamento",
        });
        return;
      }

      console.log("Departamento encontrado en profiles:", depProfile);
      res.json({
        user: {
          id: depProfile.id,
          email: depProfile.email,
        },
        role: depProfile.role,
      });
      return;
    }

    // Autenticación normal con Supabase Auth para otros usuarios
    console.log("Realizando autenticación con Supabase...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error("Error de autenticación:", error);
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    console.log(`Usuario autenticado: ${data.user.id}`);

    // Verificar el rol en la tabla profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Error al obtener perfil:", profileError);
      res.status(401).json({ error: "Perfil no encontrado" });
      return;
    }

    if (!profile) {
      console.log(
        "Perfil no encontrado, creando uno nuevo con el rol proporcionado"
      );
      // Si no existe el perfil, lo creamos
      const { error: insertError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: email,
        role: role,
        nombre: email.split("@")[0],
      });

      if (insertError) {
        console.error("Error al crear perfil:", insertError);
      }
    } else if (profile.role !== role) {
      console.warn(
        `Discrepancia de rol: Usuario tiene rol ${profile.role} pero intentó acceder como ${role}`
      );
      res
        .status(401)
        .json({ error: "El rol seleccionado no coincide con el usuario" });
      return;
    }

    console.log("Login exitoso, devolviendo datos de usuario");
    // Si todo está bien, devolver el usuario, token, etc.
    res.json({ user: data.user, role: role });
  } catch (error) {
    console.error("Error interno durante login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Manejo de errores
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    res.status(500).json({ error: "Error interno del servidor" });
  }
);

const PORT = Number(process.env.PORT) || 3005;

// Agregar manejador global de errores para prevenir que la aplicación se caiga
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error no controlado:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta de health check para diagnóstico
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    supabaseConnected:
      !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY,
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`API disponible en http://0.0.0.0:${PORT}/api`);
  console.log(`Endpoint de health check: http://0.0.0.0:${PORT}/health`);
});
