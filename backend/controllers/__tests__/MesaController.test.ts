import { Request, Response } from "express";
import { MesaController } from "../MesaController";
import { MesaService } from "../../services/MesaService";
import { Mesa, EstadoMesa, EstadoConfirmacion, Docente } from "../../types";

// Mock de MesaService
jest.mock("../../services/MesaService");

// Mock de UUID
jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-mesa-id-123"),
}));

// Mock de supabase antes de otros imports
jest.mock("../../config/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { nombre: "Docente Test" },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe("MesaController", () => {
  let mesaController: MesaController;
  let mockMesaService: jest.Mocked<MesaService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const createMockMesa = (overrides: Partial<Mesa> = {}): Mesa => ({
    id: "mesa-123",
    materia: "Matemática",
    fecha: "2025-06-15",
    hora: "10:00",
    aula: "A101",
    estado: "pendiente" as EstadoMesa,
    docente_titular: "docente-1",
    docente_vocal: "docente-2",
    docentes: [
      {
        id: "docente-1",
        nombre: "Doc1",
        confirmacion: "pendiente" as EstadoConfirmacion,
      },
      {
        id: "docente-2",
        nombre: "Doc2",
        confirmacion: "pendiente" as EstadoConfirmacion,
      },
    ],
    ...overrides,
  });

  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();

    // Limpiar instancias singleton para que puedan recrearse con mocks
    (MesaController as any).instance = undefined;
    (MesaService as any).instance = undefined;

    // Mock del servicio
    mockMesaService = {
      getMesasByDocenteId: jest.fn(),
      confirmarMesa: jest.fn(),
      createMesa: jest.fn(),
      updateMesa: jest.fn(),
      deleteMesa: jest.fn(),
      getAllMesas: jest.fn(),
    } as any;

    // Mock getInstance de manera más robusta
    jest.spyOn(MesaService, "getInstance").mockReturnValue(mockMesaService);

    // Obtener instancia del controlador (esto debería usar el mock)
    mesaController = MesaController.getInstance();

    // Mock de request y response
    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  });

  describe("getInstance", () => {
    it("debería devolver la misma instancia (Singleton)", () => {
      const instance1 = MesaController.getInstance();
      const instance2 = MesaController.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("getMesasByDocenteId", () => {
    it("debería obtener mesas correctamente", async () => {
      const mockMesas = [createMockMesa({ id: "1", materia: "Test" })];
      mockMesaService.getMesasByDocenteId.mockResolvedValue(mockMesas);
      mockRequest.params = { id: "docente-123" };

      await mesaController.getMesasByDocenteId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/json"
      );
      expect(mockMesaService.getMesasByDocenteId).toHaveBeenCalledWith(
        "docente-123"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockMesas);
    });

    it("debería devolver error 400 si no se proporciona ID", async () => {
      mockRequest.params = {};

      await mesaController.getMesasByDocenteId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "ID de docente requerido",
      });
    });

    it("debería manejar errores del servicio", async () => {
      mockMesaService.getMesasByDocenteId.mockRejectedValue(
        new Error("Error del servicio")
      );
      mockRequest.params = { id: "docente-123" };

      await mesaController.getMesasByDocenteId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al obtener las mesas del docente",
        detalle: "Error del servicio",
        origen: "servicio",
      });
    });

    it("debería devolver array vacío si el servicio devuelve null", async () => {
      mockMesaService.getMesasByDocenteId.mockResolvedValue(null as any);
      mockRequest.params = { id: "docente-123" };

      await mesaController.getMesasByDocenteId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
  });

  describe("confirmarMesa", () => {
    it("debería confirmar mesa correctamente", async () => {
      const mockMesa = createMockMesa({ estado: "confirmada" as EstadoMesa });
      mockMesaService.confirmarMesa.mockResolvedValue(mockMesa);
      mockRequest.params = { mesaId: "mesa-123", docenteId: "docente-123" };
      mockRequest.body = { confirmacion: "aceptado" };

      await mesaController.confirmarMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMesaService.confirmarMesa).toHaveBeenCalledWith(
        "mesa-123",
        "docente-123",
        "aceptado"
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockMesa);
    });

    it("debería devolver error 400 para confirmación inválida", async () => {
      mockRequest.params = { mesaId: "mesa-123", docenteId: "docente-123" };
      mockRequest.body = { confirmacion: "estado-invalido" };

      await mesaController.confirmarMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Confirmación inválida",
      });
    });

    it("debería manejar error 404 del servicio", async () => {
      mockMesaService.confirmarMesa.mockRejectedValue(
        new Error("Mesa no encontrada")
      );
      mockRequest.params = { mesaId: "mesa-123", docenteId: "docente-123" };
      mockRequest.body = { confirmacion: "aceptado" };

      await mesaController.confirmarMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Mesa no encontrada",
        detalle: "La mesa solicitada no existe en la base de datos",
      });
    });

    it("debería manejar error 403 del servicio", async () => {
      mockMesaService.confirmarMesa.mockRejectedValue(
        new Error("Docente no asignado")
      );
      mockRequest.params = { mesaId: "mesa-123", docenteId: "docente-123" };
      mockRequest.body = { confirmacion: "aceptado" };

      await mesaController.confirmarMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Docente no asignado",
        detalle: "El docente no está asignado a esta mesa",
      });
    });
  });

  describe("createMesa", () => {
    it("debería crear mesa correctamente", async () => {
      const mockNuevaMesa = createMockMesa({
        id: "test-mesa-id-123",
        materia: "Matemática",
      });
      mockMesaService.createMesa.mockResolvedValue(mockNuevaMesa);
      mockRequest.body = {
        materia: "Matemática",
        fecha: "2025-06-15",
        hora: "10:00",
        aula: "A101",
        docente_titular: "docente-1",
        docente_vocal: "docente-2",
      };

      await mesaController.createMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMesaService.createMesa).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockNuevaMesa);
    });

    it("debería devolver error 400 si falta materia", async () => {
      mockRequest.body = {
        fecha: "2025-06-15",
        hora: "10:00",
        aula: "A101",
        docente_titular: "docente-1",
        docente_vocal: "docente-2",
      };

      await mesaController.createMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "La materia es un campo obligatorio",
      });
    });

    it("debería devolver error 400 si falta fecha", async () => {
      mockRequest.body = {
        materia: "Matemática",
        hora: "10:00",
        aula: "A101",
        docente_titular: "docente-1",
        docente_vocal: "docente-2",
      };

      await mesaController.createMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "La fecha es un campo obligatorio",
      });
    });

    it("debería devolver error 400 si falta docente_titular", async () => {
      mockRequest.body = {
        materia: "Matemática",
        fecha: "2025-06-15",
        hora: "10:00",
        aula: "A101",
        docente_vocal: "docente-2",
      };

      await mesaController.createMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "El docente titular es un campo obligatorio",
      });
    });

    it("debería devolver error 400 si falta docente_vocal", async () => {
      mockRequest.body = {
        materia: "Matemática",
        fecha: "2025-06-15",
        hora: "10:00",
        aula: "A101",
        docente_titular: "docente-1",
      };

      await mesaController.createMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "El docente vocal es un campo obligatorio",
      });
    });

    it("debería manejar errores de validación del servicio", async () => {
      mockMesaService.createMesa.mockRejectedValue(
        new Error("Fecha en el pasado")
      );
      mockRequest.body = {
        materia: "Matemática",
        fecha: "2025-06-15",
        hora: "10:00",
        aula: "A101",
        docente_titular: "docente-1",
        docente_vocal: "docente-2",
      };

      await mesaController.createMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error de validación",
        detalle: "Fecha en el pasado",
      });
    });
  });

  describe("updateMesa", () => {
    it("debería actualizar mesa correctamente", async () => {
      const mockMesaActual = createMockMesa();
      const mockMesaActualizada = createMockMesa({ hora: "14:00" });

      mockMesaService.getAllMesas.mockResolvedValue([mockMesaActual]);
      mockMesaService.updateMesa.mockResolvedValue(mockMesaActualizada);

      mockRequest.params = { mesaId: "mesa-123" };
      mockRequest.body = { hora: "14:00" };

      await mesaController.updateMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMesaService.updateMesa).toHaveBeenCalledWith(
        "mesa-123",
        expect.any(Object)
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockMesaActualizada);
    });

    it("debería devolver error 404 si la mesa no existe", async () => {
      mockMesaService.getAllMesas.mockResolvedValue([]);
      mockRequest.params = { mesaId: "mesa-inexistente" };
      mockRequest.body = { hora: "14:00" };

      await mesaController.updateMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Mesa no encontrada",
      });
    });

    it("debería manejar errores del servicio", async () => {
      mockMesaService.getAllMesas.mockRejectedValue(
        new Error("Error del servicio")
      );
      mockRequest.params = { mesaId: "mesa-123" };
      mockRequest.body = { hora: "14:00" };

      await mesaController.updateMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al actualizar la mesa",
      });
    });
  });

  describe("deleteMesa", () => {
    it("debería eliminar mesa correctamente", async () => {
      mockMesaService.deleteMesa.mockResolvedValue(undefined);
      mockRequest.params = { mesaId: "mesa-123" };

      await mesaController.deleteMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMesaService.deleteMesa).toHaveBeenCalledWith("mesa-123");
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it("debería manejar errores del servicio", async () => {
      mockMesaService.deleteMesa.mockRejectedValue(
        new Error("Error del servicio")
      );
      mockRequest.params = { mesaId: "mesa-123" };

      await mesaController.deleteMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al eliminar la mesa",
      });
    });
  });

  describe("getAllMesas", () => {
    it("debería obtener todas las mesas correctamente", async () => {
      const mockMesas = [
        createMockMesa({ id: "1", materia: "Matemática" }),
        createMockMesa({ id: "2", materia: "Física" }),
      ];
      mockMesaService.getAllMesas.mockResolvedValue(mockMesas);

      await mesaController.getAllMesas(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMesaService.getAllMesas).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockMesas);
    });

    it("debería manejar errores del servicio", async () => {
      mockMesaService.getAllMesas.mockRejectedValue(
        new Error("Error del servicio")
      );

      await mesaController.getAllMesas(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al obtener las mesas",
      });
    });
  });

  describe("Tests adicionales para cobertura completa", () => {
    it("debería manejar error general en getMesasByDocenteId", async () => {
      // Simular error antes del try anidado haciendo que setHeader falle
      mockResponse.setHeader = jest.fn().mockImplementation(() => {
        throw new Error("Error general");
      });

      mockRequest.params = { id: "docente-123" };

      await mesaController.getMesasByDocenteId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al obtener las mesas del docente",
        detalle: "Error general",
        origen: "controlador",
      });
    });

    it("debería manejar error general en confirmarMesa", async () => {
      // Simular error antes del try anidado
      jest.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Error general");
      });

      mockRequest.params = { mesaId: "mesa-123", docenteId: "docente-123" };
      mockRequest.body = { confirmacion: "aceptado" };

      await mesaController.confirmarMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al procesar la solicitud",
        detalle: "Error general",
      });

      jest.restoreAllMocks();
    });

    it("debería manejar updateMesa con docente_titular y docente_vocal", async () => {
      const mockMesaActual = createMockMesa({
        docentes: [
          {
            id: "docente-1",
            nombre: "Doc1",
            confirmacion:
              "aceptado" as import("../../types").EstadoConfirmacion,
          },
          {
            id: "docente-2",
            nombre: "Doc2",
            confirmacion:
              "pendiente" as import("../../types").EstadoConfirmacion,
          },
        ],
      });
      const mockMesaActualizada = createMockMesa({ hora: "14:00" });

      mockMesaService.getAllMesas.mockResolvedValue([mockMesaActual]);
      mockMesaService.updateMesa.mockResolvedValue(mockMesaActualizada);

      mockRequest.params = { mesaId: "mesa-123" };
      mockRequest.body = {
        hora: "14:00",
        docente_titular: "docente-1", // Mismo docente para mantener confirmación
        docente_vocal: "docente-3", // Nuevo docente
      };

      await mesaController.updateMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMesaService.updateMesa).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockMesaActualizada);
    });

    // Tests adicionales para mejorar branch coverage
    it("debería manejar error sin mensaje en confirmarMesa", async () => {
      mockMesaService.confirmarMesa.mockRejectedValue(
        { message: null } // Error sin mensaje para cubrir el || branch
      );
      mockRequest.params = { mesaId: "mesa-123", docenteId: "docente-123" };
      mockRequest.body = { confirmacion: "aceptado" };

      await mesaController.confirmarMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al confirmar la mesa",
        detalle: "Error desconocido",
      });
    });

    it("debería manejar error sin mensaje en getMesasByDocenteId", async () => {
      mockMesaService.getMesasByDocenteId.mockRejectedValue(
        { message: null } // Error sin mensaje para cubrir el || branch
      );
      mockRequest.params = { id: "docente-123" };

      await mesaController.getMesasByDocenteId(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al obtener las mesas del docente",
        detalle: "Error en el servicio",
        origen: "servicio",
      });
    });

    it("debería manejar createMesa sin aula (aula || '')", async () => {
      const mockNuevaMesa = createMockMesa({ aula: "" });
      mockMesaService.createMesa.mockResolvedValue(mockNuevaMesa);
      mockRequest.body = {
        materia: "Matemática",
        fecha: "2025-06-15",
        hora: "10:00",
        // aula: undefined/null para cubrir el || branch
        docente_titular: "docente-1",
        docente_vocal: "docente-2",
      };

      await mesaController.createMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMesaService.createMesa).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("debería manejar error sin mensaje en createMesa", async () => {
      mockMesaService.createMesa.mockRejectedValue(
        { message: null } // Error sin mensaje para cubrir el || branch
      );
      mockRequest.body = {
        materia: "Matemática",
        fecha: "2025-06-15",
        hora: "10:00",
        aula: "A101",
        docente_titular: "docente-1",
        docente_vocal: "docente-2",
      };

      await mesaController.createMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al crear la mesa",
        detalle: "Error desconocido",
      });
    });

    it("debería manejar updateMesa con aula undefined (ternario)", async () => {
      const mockMesaActual = createMockMesa({ aula: "Aula Original" });
      const mockMesaActualizada = createMockMesa({ aula: "Aula Original" });

      mockMesaService.getAllMesas.mockResolvedValue([mockMesaActual]);
      mockMesaService.updateMesa.mockResolvedValue(mockMesaActualizada);

      mockRequest.params = { mesaId: "mesa-123" };
      mockRequest.body = {
        aula: undefined, // Para cubrir el ternario aula !== undefined
        hora: "14:00",
      };

      await mesaController.updateMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMesaService.updateMesa).toHaveBeenCalledWith(
        "mesa-123",
        expect.objectContaining({
          aula: "Aula Original", // Debería mantener el aula original
        })
      );
    });

    it("debería manejar updateMesa sin fecha/hora para cubrir || branches", async () => {
      const mockMesaActual = createMockMesa({
        fecha: "2025-01-01",
        hora: "10:00",
      });
      const mockMesaActualizada = createMockMesa();

      mockMesaService.getAllMesas.mockResolvedValue([mockMesaActual]);
      mockMesaService.updateMesa.mockResolvedValue(mockMesaActualizada);

      mockRequest.params = { mesaId: "mesa-123" };
      mockRequest.body = {
        // No fecha, no hora para cubrir los || branches
        estado: "confirmada",
      };

      await mesaController.updateMesa(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockMesaService.updateMesa).toHaveBeenCalledWith(
        "mesa-123",
        expect.objectContaining({
          fecha: "2025-01-01", // Debería mantener la fecha original
          hora: "10:00", // Debería mantener la hora original
        })
      );
    });


  });
});
