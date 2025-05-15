import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import mesaRoutes from "./routes/mesaRoutes";
import { WebSocketNotificacionStrategy } from "./strategies/NotificacionStrategy";
import { supabase } from "./config/supabase";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Configuración de middleware
app.use(cors());
app.use(express.json());

// Configuración de WebSocket
const wsStrategy = WebSocketNotificacionStrategy.getInstance();
wsStrategy.setSocketIO(io);

// Rutas
app.use("/api", mesaRoutes);

app.post("/api/login", async (req, res) => {
  const { email, password, role } = req.body;

  // Autenticación con Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  // Verificar el rol en la tabla profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(401).json({ error: "Perfil no encontrado" });
  }

  if (profile.role !== role) {
    return res
      .status(401)
      .json({ error: "El rol seleccionado no coincide con el usuario" });
  }

  // Si todo está bien, puedes devolver el usuario, token, etc.
  return res.json({ user: data.user, role: profile.role });
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

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
