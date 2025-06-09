import { MesaService } from "../MesaService";
import { MesaRepository } from "../../repositories/MesaRepository";
import { NotificacionFactory } from "../../factories/NotificacionFactory";
import {
  WebSocketNotificacionStrategy,
  PushNotificacionStrategy,
} from "../../strategies/NotificacionStrategy";

jest.mock("../../repositories/MesaRepository");
jest.mock("../../factories/NotificacionFactory");
jest.mock("../../strategies/NotificacionStrategy");

describe("MesaService", () => {
  let mesaService: MesaService;
  let mockRepo: any;
  let mockStrategy: any;

  beforeEach(() => {
    mockRepo = {
      getMesasByDocenteId: jest.fn(),
      updateConfirmacion: jest.fn(),
      getAllMesas: jest.fn(),
      createMesa: jest.fn(),
      updateMesa: jest.fn(),
    };
    (MesaRepository.getInstance as jest.Mock).mockReturnValue(mockRepo);
    mockStrategy = { enviar: jest.fn() };
    mesaService = new MesaService(mockStrategy);
  });

  it("debería obtener mesas por docente", async () => {
    mockRepo.getMesasByDocenteId.mockResolvedValue(["mesa1"]);
    const result = await mesaService.getMesasByDocenteId("doc1");
    expect(result).toEqual(["mesa1"]);
  });

  it("debería confirmar mesa y notificar", async () => {
    const mesa = {
      docentes: [
        { id: "d1", confirmacion: "aceptado", nombre: "Docente1" },
        { id: "d2", confirmacion: "aceptado", nombre: "Docente2" },
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "msg",
      tipo: "confirmacion",
      timestamp: new Date(),
    });
    (
      NotificacionFactory.crearNotificacionActualizacion as jest.Mock
    ).mockReturnValue({
      mensaje: "actualizacion",
      tipo: "actualizacion",
      timestamp: new Date(),
    });
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue({
      enviar: jest.fn(),
    });
    const result = await mesaService.confirmarMesa("m1", "d1", "aceptado");
    expect(result).toBe(mesa);
    expect(mockStrategy.enviar).toHaveBeenCalled();
  });

  it("debería manejar error en confirmarMesa", async () => {
    mockRepo.updateConfirmacion.mockRejectedValue(new Error("fail"));
    await expect(
      mesaService.confirmarMesa("m1", "d1", "aceptado")
    ).rejects.toThrow("fail");
  });

  it("debería enviar recordatorio si la mesa es válida", async () => {
    const mesa = {
      id: "m1",
      estado: "confirmada",
      docentes: [{ id: "d1" }, { id: "d2" }],
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.getAllMesas.mockResolvedValue([mesa]);
    (
      NotificacionFactory.crearNotificacionRecordatorio as jest.Mock
    ).mockReturnValue({
      mensaje: "msg",
      tipo: "recordatorio",
      timestamp: new Date(),
    });
    await mesaService.enviarRecordatorio("m1");
    expect(mockStrategy.enviar).toHaveBeenCalled();
  });

  it("no debería enviar recordatorio si la mesa no es válida", async () => {
    mockRepo.getAllMesas.mockResolvedValue([]);
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    await mesaService.enviarRecordatorio("m1");
    expect(mockStrategy.enviar).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("debería crear una mesa y notificar a los docentes", async () => {
    const mesa = {
      docentes: [
        { id: "d1", nombre: "Doc1" },
        { id: "d2", nombre: "Doc2" },
      ],
      id: "m1",
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.createMesa.mockResolvedValue(mesa);
    (
      NotificacionFactory.crearNotificacionActualizacion as jest.Mock
    ).mockReturnValue({
      mensaje: "msg",
      tipo: "actualizacion",
      timestamp: new Date(),
    });
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue({
      enviar: jest.fn(),
    });
    const result = await mesaService.createMesa(mesa as any);
    expect(result).toBe(mesa);
  });

  it("debería actualizar una mesa", async () => {
    const mesa = {
      id: "m1",
      docentes: [],
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.updateMesa.mockResolvedValue(mesa);
    const result = await mesaService.updateMesa("m1", { estado: "confirmada" });
    expect(result).toBe(mesa);
  });
});
