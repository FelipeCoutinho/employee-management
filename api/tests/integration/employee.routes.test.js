import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { Employee } from '../../src/domains/employee/employee.model.js';

const validEmployee = {
  name: 'Ana Souza',
  admissionDate: '2020-01-15',
  dismissalDate: null,
  workStart: '08:00',
  workEnd: '17:00',
  closingPeriodicity: 'Mensal',
};

describe('employee routes', () => {
  let mongo;
  let app;

  beforeAll(async () => {
    process.env.MONGOMS_VERSION = '7.0.14';
    mongo = await MongoMemoryServer.create();

    const { connectDatabase } = await import('../../src/config/database.js');
    ({ app } = await import('../../src/app.js'));

    process.env.MONGODB_URI = mongo.getUri();
    process.env.CORS_ORIGIN = 'http://localhost:8080';
    process.env.PORT = '3000';

    await connectDatabase();
  }, 120000);

  afterAll(async () => {
    const { disconnectDatabase } = await import('../../src/config/database.js');
    await disconnectDatabase();
    await mongo.stop();
  });

  beforeEach(async () => {
    await Employee.deleteMany({});
  });

  it('creates an employee and hides persistence fields', async () => {
    const response = await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, name: '<img src=x onerror=alert()>' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: '<img src=x onerror=alert()>',
      admissionDate: '2020-01-15',
      dismissalDate: null,
      workStart: '08:00',
      workEnd: '17:00',
      closingPeriodicity: 'Mensal',
    });
    expect(response.body).not.toHaveProperty('_id');
    expect(response.body).not.toHaveProperty('__v');
  });

  it.each([undefined, '', null])(
    'stores a blank dismissal date as null (%p)',
    async (dismissalDate) => {
      const payload = { ...validEmployee };

      if (dismissalDate === undefined) {
        delete payload.dismissalDate;
      } else {
        payload.dismissalDate = dismissalDate;
      }

      const response = await request(app).post('/api/employees').send(payload);

      expect(response.status).toBe(201);
      expect(response.body.dismissalDate).toBeNull();
    },
  );

  it('lists employees by admission date and then by creation order', async () => {
    await request(app).post('/api/employees').send({
      ...validEmployee,
      name: 'Mais recente',
      admissionDate: '2021-01-01',
    });
    await request(app).post('/api/employees').send({
      ...validEmployee,
      name: 'Mais antigo',
      admissionDate: '2019-01-01',
    });
    await request(app).post('/api/employees').send({
      ...validEmployee,
      name: 'Empate',
      admissionDate: '2021-01-01',
    });

    const response = await request(app).get('/api/employees');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.map((employee) => employee.name)).toEqual([
      'Mais antigo',
      'Mais recente',
      'Empate',
    ]);
  });

  it('gets, updates and removes an employee', async () => {
    const created = await request(app).post('/api/employees').send(validEmployee);
    const id = created.body.id;

    const found = await request(app).get(`/api/employees/${id}`);
    expect(found.status).toBe(200);
    expect(found.body.name).toBe('Ana Souza');

    const updated = await request(app).put(`/api/employees/${id}`).send({
      ...validEmployee,
      name: 'Ana Lima',
      admissionDate: '2099-01-01',
      dismissalDate: '2099-02-01',
      workEnd: '18:00',
      closingPeriodicity: 'Anual',
    });

    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id,
      name: 'Ana Lima',
      admissionDate: '2099-01-01',
      dismissalDate: '2099-02-01',
      workEnd: '18:00',
      closingPeriodicity: 'Anual',
    });

    const removed = await request(app).delete(`/api/employees/${id}`);
    expect(removed.status).toBe(204);
    expect(removed.text).toBe('');

    const missing = await request(app).get(`/api/employees/${id}`);
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ message: 'Funcionário não encontrado.' });
  });

  it('returns 404 from async controllers when updating or deleting a missing employee', async () => {
    const id = '507f1f77bcf86cd799439011';

    const updated = await request(app).put(`/api/employees/${id}`).send(validEmployee);
    const removed = await request(app).delete(`/api/employees/${id}`);

    expect(updated.status).toBe(404);
    expect(updated.body).toEqual({ message: 'Funcionário não encontrado.' });
    expect(removed.status).toBe(404);
    expect(removed.body).toEqual({ message: 'Funcionário não encontrado.' });
  });

  it('returns 400 for an id that is not 24 hexadecimal characters', async () => {
    const response = await request(app).get('/api/employees/507f1f77bcf8');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Identificador inválido.' });
  });

  it('returns the periodicities without colliding with the id route', async () => {
    const response = await request(app).get('/api/employees/periodicities');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual']);
  });

  it('returns 400 with field errors for invalid data', async () => {
    const response = await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, name: '!!!' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Dados inválidos.');
    expect(response.body.errors).toContainEqual({
      field: 'name',
      message: 'O nome deve conter ao menos uma letra.',
    });
  });

  it('returns 400 when a field has the wrong type', async () => {
    const response = await request(app)
      .post('/api/employees')
      .send({ ...validEmployee, name: 123 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      field: 'name',
      message: 'Deve ser um texto.',
    });
  });

  it('returns 400 for malformed JSON and for a JSON value that is not an object', async () => {
    const malformed = await request(app)
      .post('/api/employees')
      .set('Content-Type', 'application/json')
      .send('{"name":');
    const rawText = await request(app)
      .post('/api/employees')
      .set('Content-Type', 'application/json')
      .send('abc');
    const jsonString = await request(app)
      .post('/api/employees')
      .set('Content-Type', 'application/json')
      .send('"abc"');

    for (const response of [malformed, rawText, jsonString]) {
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Corpo da requisição inválido.' });
    }
  });

  it('returns 400 when the body is missing or is an array', async () => {
    const missing = await request(app).post('/api/employees');
    const arrayBody = await request(app).post('/api/employees').send([{ name: 'Ana' }]);

    expect(missing.status).toBe(400);
    expect(missing.body).toEqual({ message: 'Corpo da requisição inválido.' });
    expect(arrayBody.status).toBe(400);
    expect(arrayBody.body).toEqual({ message: 'Corpo da requisição inválido.' });
  });

  it('sends the CORS header only for the configured origin', async () => {
    const allowed = await request(app)
      .get('/api/employees/periodicities')
      .set('Origin', 'http://localhost:8080');
    const allowedPreflight = await request(app)
      .options('/api/employees')
      .set('Origin', 'http://localhost:8080')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');
    const blockedPreflight = await request(app)
      .options('/api/employees')
      .set('Origin', 'http://evil.example')
      .set('Access-Control-Request-Method', 'DELETE')
      .set('Access-Control-Request-Headers', 'content-type');

    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:8080');
    expect(allowedPreflight.headers['access-control-allow-origin']).toBe('http://localhost:8080');
    expect(allowedPreflight.headers['access-control-allow-methods']).toEqual(expect.stringContaining('POST'));
    expect(blockedPreflight.headers['access-control-allow-origin']).toBeUndefined();
  });
});
