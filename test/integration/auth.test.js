import request from 'supertest';
import app from '../../src/app.js';
import { resetDb, disconnectDb } from '../helpers/test-db.js';

beforeEach(async () => await resetDb());
afterAll(async () => await disconnectDb());

async function registerAndLogin(email = 'test@example.com', password = 'password123') {
  await request(app).post('/api/auth/register').send({ email, password });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return { accessToken: res.body.accessToken, cookie: res.headers['set-cookie'] };
}

describe('POST /api/auth/register', () => {
  it('registro exitoso -> 201 + usuario sin campo password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).toMatchObject({ email: 'test@example.com', role: 'USER' });
    expect(res.body).toHaveProperty('id');
  });

  it('email ya existente -> 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'otherpassword' });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ message: 'Resource already exists' });
  });
});

describe('POST /api/auth/login', () => {
  it('credenciales correctas -> 200 + accessToken en body + cookie refreshToken', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=')])
    );
  });

  it('password incorrecto -> 401', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: 'Invalid credentials' });
  });

  it('email inexistente -> 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: 'Invalid credentials' });
  });
});

describe('GET /api/auth/profile', () => {
  it('con accessToken válido -> 200 + datos del usuario', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'test@example.com', role: 'USER' });
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('sin token -> 401', async () => {
    const res = await request(app).get('/api/auth/profile');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: 'Unauthorized' });
  });

  it('token malformado → 401', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer not.a.valid.token');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: 'Invalid token' });
  });
});

describe('POST /api/auth/refresh-token', () => {
  it('refresh token válido -> 200 + nuevo accessToken + nueva cookie refreshToken', async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=')])
    );
  });

  it('sin cookie -> 401', async () => {
    const res = await request(app).post('/api/auth/refresh-token');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: 'Refresh token required' });
  });

  it('token ya consumido → 401 (demuestra que la rotación invalida el token anterior)', async () => {
    const { cookie } = await registerAndLogin();

    // primer uso: rota el token correctamente
    await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', cookie);

    // segundo uso con el token original ya consumido → debe rechazarlo
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', cookie);

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: 'Invalid refresh token' });
  });

  it('refresh token inválido -> 401 + cookie stale eliminada', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', 'refreshToken=invalidtoken');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: 'Invalid refresh token' });
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=;')])
    );
  });
});

describe('POST /api/auth/logout', () => {
  it('logout exitoso -> 204 + cookie refreshToken eliminada', async () => {
    const { cookie } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(res.status).toBe(204);
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=;')])
    );
  });

  it('sin cookie -> 400', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: 'Refresh token required' });
  });
});
