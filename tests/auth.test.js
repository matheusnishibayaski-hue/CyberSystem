const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db.config');

describe('Auth', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  });

  afterAll(async () => {
    await pool.end();
  });

  it('Deve logar com credenciais válidas', async () => {
    const email = `user_${Date.now()}@test.com`;
    const password = 'Senha123!';

    const registerRes = await request(app).post('/api/auth/register').send({
      email,
      password
    });
    expect(registerRes.status).toBe(201);

    const res = await request(app).post('/api/auth/login').send({
      email,
      password
    });
    expect(res.status).toBe(200);
  });

  const createUserAndLogin = async (role = 'viewer') => {
    const email = `user_${role}_${Date.now()}@test.com`;
    const password = 'Senha123!';

    const registerRes = await request(app).post('/api/auth/register').send({
      email,
      password
    });
    expect(registerRes.status).toBe(201);

    if (role === 'admin') {
      await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email]);
    }

    const loginRes = await request(app).post('/api/auth/login').send({
      email,
      password
    });
    expect(loginRes.status).toBe(200);
    return loginRes.body.token;
  };

  it('Rota protegida sem token deve retornar 401', async () => {
    await request(app)
      .get('/api/protected/profile')
      .expect(401);
  });

  it('Rota admin com user comum deve retornar 403', async () => {
    const userToken = await createUserAndLogin('viewer');

    await request(app)
      .get('/api/auth/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('Rota admin com admin deve retornar 200', async () => {
    const adminToken = await createUserAndLogin('admin');

    await request(app)
      .get('/api/auth/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
