import request from 'supertest';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import autenticarJWT from './autenticacion';

// Clave secreta usada en el middleware
const SECRET = 'TU_SECRETO';

// Crea una app de Express para pruebas
const app = express();
app.use(express.json());

// Ruta protegida solo para roles 'docente' y 'departamento'
app.get('/protegida', autenticarJWT(['docente', 'departamento']), (req: Request, res: Response) => {
  res.json({ mensaje: 'Acceso concedido', usuario: (req as any).usuario });
});

describe('Middleware autenticarJWT', () => {
  it('permite acceso con token válido y rol permitido', async () => {
    const token = jwt.sign({ rol: 'docente', nombre: 'Juan' }, SECRET);
    const res = await request(app)
      .get('/protegida')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('Acceso concedido');
    expect(res.body.usuario.rol).toBe('docente');
  });

  it('deniega acceso con token válido pero rol NO permitido', async () => {
    const token = jwt.sign({ rol: 'alumno', nombre: 'Pedro' }, SECRET);
    const res = await request(app)
      .get('/protegida')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe('No tienes permisos suficientes');
  });

  it('deniega acceso con token inválido', async () => {
    const token = 'token_invalido';
    const res = await request(app)
      .get('/protegida')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.mensaje).toBe('Token inválido o expirado');
  });

  it('deniega acceso si no se envía token', async () => {
    const res = await request(app).get('/protegida');
    expect(res.status).toBe(401);
    expect(res.body.mensaje).toBe('No se proporcionó token de autenticación');
  });
}); 