import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import mesaRoutes from "./routes/mesaRoutes";
import { WebSocketNotificacionStrategy } from "./strategies/NotificacionStrategy";

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

// Manejo de errores
app.use((err: Error, req: express.Request, res: express.Response) => {
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {});
