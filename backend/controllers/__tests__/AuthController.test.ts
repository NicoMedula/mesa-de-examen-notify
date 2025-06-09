import { Request, Response } from "express";
import { AuthController } from "../AuthController";

// Mock de supabase
jest.mock("../../config/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

describe("AuthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock de supabase
    mockSupabase = require("../../config/supabase").supabase;

    // Mock de request y response
    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock de variables de entorno
    process.env.NODE_ENV = "test";
  });

  describe("requestPasswordReset", () => {
    it("debería solicitar restablecimiento de contraseña en modo desarrollo", async () => {
      process.env.NODE_ENV = "development";
      mockRequest.body = { email: "test@example.com" };

      // Spy en console.log para verificar los logs
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await AuthController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("MODO DE PRUEBA"),
          testToken: expect.stringMatching(/^test_/),
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith("===== MODO DE PRUEBA =====");

      consoleSpy.mockRestore();
    });

    it("debería solicitar restablecimiento de contraseña en modo producción", async () => {
      process.env.NODE_ENV = "production";
      mockRequest.body = { email: "test@example.com" };
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      await AuthController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/reset-password"),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message:
          "Si el correo existe, recibirá un enlace para restablecer su contraseña",
      });
    });

    it("debería devolver error 400 si no se proporciona email", async () => {
      mockRequest.body = {};

      await AuthController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "El email es requerido",
      });
    });

    it("debería manejar errores de Supabase en producción", async () => {
      process.env.NODE_ENV = "production";
      mockRequest.body = { email: "test@example.com" };
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: "Error de Supabase" },
      });

      await AuthController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error de Supabase",
      });
    });

    it("debería manejar errores de excepción", async () => {
      process.env.NODE_ENV = "production";
      mockRequest.body = { email: "test@example.com" };
      mockSupabase.auth.resetPasswordForEmail.mockRejectedValue(
        new Error("Error de conexión")
      );

      await AuthController.requestPasswordReset(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al procesar la solicitud",
      });
    });
  });

  describe("updatePassword", () => {
    it("debería actualizar contraseña en modo desarrollo con token válido", async () => {
      process.env.NODE_ENV = "development";
      mockRequest.body = { token: "test_12345", password: "newpassword123" };

      // Spy en console.log para verificar los logs
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await AuthController.updatePassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message:
          "MODO DE PRUEBA: Contraseña actualizada correctamente (simulado)",
      });
      expect(consoleSpy).toHaveBeenCalledWith("===== MODO DE PRUEBA =====");

      consoleSpy.mockRestore();
    });

    it("debería rechazar token inválido en modo desarrollo", async () => {
      process.env.NODE_ENV = "development";
      mockRequest.body = { token: "invalid_token", password: "newpassword123" };

      await AuthController.updatePassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Token de prueba inválido. Debe empezar con 'test_'",
      });
    });

    it("debería actualizar contraseña en modo producción", async () => {
      process.env.NODE_ENV = "production";
      mockRequest.body = { token: "valid_token", password: "newpassword123" };
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: {},
        error: null,
      });

      await AuthController.updatePassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: "newpassword123",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Contraseña actualizada correctamente",
      });
    });

    it("debería devolver error 400 si faltan parámetros", async () => {
      mockRequest.body = { token: "test_token" }; // Falta password

      await AuthController.updatePassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Token y contraseña son requeridos",
      });
    });

    it("debería manejar errores de Supabase en producción", async () => {
      process.env.NODE_ENV = "production";
      mockRequest.body = { token: "valid_token", password: "newpassword123" };
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: null,
        error: { message: "Error de Supabase" },
      });

      await AuthController.updatePassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error de Supabase",
      });
    });

    it("debería manejar errores de excepción", async () => {
      process.env.NODE_ENV = "production";
      mockRequest.body = { token: "valid_token", password: "newpassword123" };
      mockSupabase.auth.updateUser.mockRejectedValue(
        new Error("Error de conexión")
      );

      await AuthController.updatePassword(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error al procesar la solicitud",
      });
    });
  });
});
