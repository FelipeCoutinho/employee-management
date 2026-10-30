import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { AppError } from '../../../src/shared/errors/AppError.js';
import { ValidationError } from '../../../src/shared/errors/ValidationError.js';
import { errorHandler } from '../../../src/shared/middlewares/errorHandler.js';

function createResponse() {
  return {
    headersSent: false,
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('error handler', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the application ValidationError status and field errors', () => {
    const response = createResponse();

    errorHandler(
      new ValidationError([{ field: 'name', message: 'Campo obrigatório.' }]),
      {},
      response,
      () => {},
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      message: 'Dados inválidos.',
      errors: [{ field: 'name', message: 'Campo obrigatório.' }],
    });
  });

  it('uses the status and message of an AppError', () => {
    const response = createResponse();

    errorHandler(new AppError('Funcionário não encontrado.', 404), {}, response, () => {});

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ message: 'Funcionário não encontrado.' });
  });

  it('does not treat a Mongoose error named ValidationError as the application error', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = createResponse();
    const mongooseError = new Error('Cast to ObjectId failed for value secret-detail');
    mongooseError.name = 'ValidationError';

    errorHandler(mongooseError, {}, response, () => {});

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ message: 'Ocorreu um erro interno. Tente novamente.' });
    expect(JSON.stringify(response.body)).not.toContain('secret-detail');
  });

  it('returns 400 for malformed JSON', () => {
    const response = createResponse();
    const error = new SyntaxError('Unexpected token');
    error.type = 'entity.parse.failed';
    error.status = 400;

    errorHandler(error, {}, response, () => {});

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ message: 'Corpo da requisição inválido.' });
  });

  it('uses a generic message for other 4xx errors', () => {
    const response = createResponse();
    const error = new Error('request entity too large');
    error.status = 413;

    errorHandler(error, {}, response, () => {});

    expect(response.statusCode).toBe(413);
    expect(response.body).toEqual({ message: 'Não foi possível processar a requisição.' });
  });
});
