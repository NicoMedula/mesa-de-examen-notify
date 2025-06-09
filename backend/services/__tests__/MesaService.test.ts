import { jest } from "@jest/globals";
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
    // Limpiar instancias singleton para cada test
    (MesaService as any).instance = undefined;
    (WebSocketNotificacionStrategy as any).instance = undefined;
    (PushNotificacionStrategy as any).instance = undefined;

    mockRepo = {
      getMesasByDocenteId: jest.fn(),
      updateConfirmacion: jest.fn(),
      getAllMesas: jest.fn(),
      createMesa: jest.fn(),
      updateMesa: jest.fn(),
      deleteMesa: jest.fn(),
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

  it("debería crear instancia singleton sin estrategia", () => {
    (WebSocketNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockStrategy
    );
    const instance = MesaService.getInstance();
    expect(instance).toBeInstanceOf(MesaService);
    expect(WebSocketNotificacionStrategy.getInstance).toHaveBeenCalled();
  });

  it("debería crear instancia singleton con estrategia", () => {
    const customStrategy = { enviar: jest.fn() };
    const instance = MesaService.getInstance(customStrategy as any);
    expect(instance).toBeInstanceOf(MesaService);
  });

  it("debería permitir cambiar estrategia de notificación", () => {
    const nuevaEstrategia = { enviar: jest.fn() };
    mesaService.setNotificacionStrategy(nuevaEstrategia as any);
    // El método debe ejecutarse sin errores
    expect(true).toBe(true);
  });

  it("debería notificar cuando ambos docentes aceptan", async () => {
    const mesa = {
      docentes: [
        { id: "d1", confirmacion: "aceptado", nombre: "Docente1" },
        { id: "d2", confirmacion: "aceptado", nombre: "Docente2" },
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "confirmacion",
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

    await mesaService.confirmarMesa("m1", "d1", "aceptado");

    // Debe haber llamado a PushNotificacionStrategy dos veces (docentes + departamento)
    expect(mockPushStrategy.enviar).toHaveBeenCalledTimes(2);
  });

  it("debería notificar cuando un docente rechaza", async () => {
    const mesa = {
      docentes: [
        { id: "d1", confirmacion: "rechazado", nombre: "Docente1" },
        { id: "d2", confirmacion: "pendiente", nombre: "Docente2" },
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "confirmacion",
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

    await mesaService.confirmarMesa("m1", "d1", "rechazado");

    // Debe haber notificado al otro docente y al departamento
    expect(mockPushStrategy.enviar).toHaveBeenCalledTimes(2);
  });

  it("debería actualizar mesa y notificar cuando estado es confirmada", async () => {
    const mesa = {
      id: "m1",
      docentes: [
        { id: "d1", nombre: "Docente1" },
        { id: "d2", nombre: "Docente2" },
      ],
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.updateMesa.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionActualizacion as jest.Mock
    ).mockReturnValue({
      mensaje: "actualizacion",
      tipo: "actualizacion",
      timestamp: new Date(),
    });

    await mesaService.updateMesa("m1", { estado: "confirmada" });

    // Debe haber notificado a ambos docentes
    expect(mockPushStrategy.enviar).toHaveBeenCalledTimes(2);
  });

  it("debería actualizar mesa y notificar cuando estado es pendiente", async () => {
    const mesa = {
      id: "m1",
      docentes: [
        { id: "d1", nombre: "Docente1" },
        { id: "d2", nombre: "Docente2" },
      ],
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.updateMesa.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionActualizacion as jest.Mock
    ).mockReturnValue({
      mensaje: "actualizacion",
      tipo: "actualizacion",
      timestamp: new Date(),
    });

    await mesaService.updateMesa("m1", { estado: "pendiente" });

    // Debe haber notificado a ambos docentes
    expect(mockPushStrategy.enviar).toHaveBeenCalledTimes(2);
  });

  it("debería eliminar una mesa", async () => {
    mockRepo.deleteMesa.mockResolvedValue(undefined);
    await mesaService.deleteMesa("m1");
    expect(mockRepo.deleteMesa).toHaveBeenCalledWith("m1");
  });

  it("debería obtener todas las mesas", async () => {
    const mesas = [{ id: "m1" }, { id: "m2" }];
    mockRepo.getAllMesas.mockResolvedValue(mesas);
    const result = await mesaService.getAllMesas();
    expect(result).toBe(mesas);
    expect(mockRepo.getAllMesas).toHaveBeenCalled();
  });

  // Test adicional para branch coverage: cuando no se encuentra el docente (línea 53)
  it("debería manejar caso donde docente no se encuentra en la mesa", async () => {
    const mesa = {
      docentes: [
        { id: "d2", confirmacion: "pendiente", nombre: "Docente2" },
        { id: "d3", confirmacion: "pendiente", nombre: "Docente3" },
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "confirmacion",
      tipo: "confirmacion",
      timestamp: new Date(),
    });

    await mesaService.confirmarMesa("m1", "d1", "aceptado"); // d1 no está en la mesa

    // No debe enviar notificación porque el docente no está en la mesa
    expect(mockStrategy.enviar).not.toHaveBeenCalled();
  });

  // Test para cubrir updateMesa sin estado específico (sin notificación)
  it("debería actualizar mesa sin notificar cuando no cambia estado específico", async () => {
    const mesa = {
      id: "m1",
      docentes: [
        { id: "d1", nombre: "Docente1" },
        { id: "d2", nombre: "Docente2" },
      ],
      fecha: "2025-01-01",
      hora: "10:00",
      aula: "A",
    };
    mockRepo.updateMesa.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );

    await mesaService.updateMesa("m1", { hora: "14:00" }); // Sin cambio de estado

    // No debe haber enviado notificaciones push porque no cambió el estado
    expect(mockPushStrategy.enviar).not.toHaveBeenCalled();
  });

  // Test adicional para cubrir branch donde NO ambos docentes han aceptado
  it("debería manejar cuando NO ambos docentes han aceptado", async () => {
    const mesa = {
      docentes: [
        { id: "d1", confirmacion: "aceptado", nombre: "Docente1" },
        { id: "d2", confirmacion: "pendiente", nombre: "Docente2" }, // UNO pendiente
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "confirmacion",
      tipo: "confirmacion",
      timestamp: new Date(),
    });

    await mesaService.confirmarMesa("m1", "d1", "aceptado");

    // NO debe haber llamado a PushNotificacionStrategy porque no ambos aceptaron
    expect(mockPushStrategy.enviar).not.toHaveBeenCalled();
    // Pero sí debe haber enviado la notificación regular
    expect(mockStrategy.enviar).toHaveBeenCalled();
  });

  // Test para cubrir cuando confirmacion NO es "rechazado"
  it("debería manejar confirmación que no es rechazado (pendiente/aceptado)", async () => {
    const mesa = {
      docentes: [
        { id: "d1", confirmacion: "pendiente", nombre: "Docente1" },
        { id: "d2", confirmacion: "pendiente", nombre: "Docente2" },
      ],
      id: "m1",
    };
    mockRepo.updateConfirmacion.mockResolvedValue(mesa);

    const mockPushStrategy = { enviar: jest.fn() };
    (PushNotificacionStrategy.getInstance as jest.Mock).mockReturnValue(
      mockPushStrategy
    );
    (
      NotificacionFactory.crearNotificacionConfirmacion as jest.Mock
    ).mockReturnValue({
      mensaje: "confirmacion",
      tipo: "confirmacion",
      timestamp: new Date(),
    });

    await mesaService.confirmarMesa("m1", "d1", "pendiente"); // NO es "rechazado"

    // No debe entrar en el bloque de rechazo
    expect(mockPushStrategy.enviar).not.toHaveBeenCalled();
  });
});
