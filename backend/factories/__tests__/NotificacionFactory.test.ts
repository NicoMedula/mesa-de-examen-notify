import { NotificacionFactory } from "../NotificacionFactory";
describe("NotificacionFactory", () => {
  const mesa = {
    materia: "Matemática",
    fecha: "2025-01-01",
    hora: "10:00",
    aula: "A",
    docentes: [],
  };
  const docente = { nombre: "Juan", confirmacion: "aceptado", id: "1" };

  it("debería crear una notificación de confirmación", () => {
    const notif = NotificacionFactory.crearNotificacionConfirmacion(
      mesa as any,
      docente as any
    );
    expect(notif.mensaje).toContain("Juan");
    expect(notif.tipo).toBe("confirmacion");
    expect(notif.timestamp).toBeInstanceOf(Date);
  });

  it("debería crear una notificación de recordatorio", () => {
    const notif = NotificacionFactory.crearNotificacionRecordatorio(
      mesa as any
    );
    expect(notif.mensaje).toContain("Recordatorio");
    expect(notif.tipo).toBe("recordatorio");
    expect(notif.timestamp).toBeInstanceOf(Date);
  });

  it("debería crear una notificación de actualización", () => {
    const notif = NotificacionFactory.crearNotificacionActualizacion(
      mesa as any,
      "Cambio importante"
    );
    expect(notif.mensaje).toContain("Cambio importante");
    expect(notif.tipo).toBe("actualizacion");
    expect(notif.timestamp).toBeInstanceOf(Date);
  });
});
