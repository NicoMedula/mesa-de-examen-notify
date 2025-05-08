import { NotificacionFactory } from '../NotificacionFactory';
import { Mesa, Docente } from '../../types';

describe('NotificacionFactory', () => {
  const mesa: Mesa = {
    id: 'M1',
    fecha: '2025-06-15',
    hora: '10:00',
    ubicacion: 'Aula 301',
    docentes: []
  };
  const docente: Docente = {
    id: '123',
    nombre: 'Prof. Gómez',
    confirmacion: 'aceptado'
  };

  it('debería crear una notificación de confirmación', () => {
    const notif = NotificacionFactory.crearNotificacionConfirmacion(mesa, docente);
    expect(notif.mensaje).toContain('aceptado');
    expect(notif.tipo).toBe('confirmacion');
    expect(notif.timestamp).toBeInstanceOf(Date);
  });

  it('debería crear una notificación de recordatorio', () => {
    const notif = NotificacionFactory.crearNotificacionRecordatorio(mesa);
    expect(notif.mensaje).toContain('Recordatorio');
    expect(notif.tipo).toBe('recordatorio');
    expect(notif.timestamp).toBeInstanceOf(Date);
  });

  it('debería crear una notificación de actualización', () => {
    const notif = NotificacionFactory.crearNotificacionActualizacion(mesa, 'Cambio de aula');
    expect(notif.mensaje).toContain('Cambio de aula');
    expect(notif.tipo).toBe('actualizacion');
    expect(notif.timestamp).toBeInstanceOf(Date);
  });
}); 