const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db.config');

describe('Auth', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
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
});
