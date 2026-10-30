import { AppError } from '../errors/AppError.js';
import { ValidationError } from '../errors/ValidationError.js';

const GENERIC_CLIENT_MESSAGE = 'Não foi possível processar a requisição.';
const GENERIC_SERVER_MESSAGE = 'Ocorreu um erro interno. Tente novamente.';

export function errorHandler(error, _request, response, _next) {
  if (response.headersSent) {
    return;
  }

  if (error instanceof ValidationError) {
    response.status(error.status).json({
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.status).json({ message: error.message });
    return;
  }

  if (error.type === 'entity.parse.failed') {
    response.status(400).json({ message: 'Corpo da requisição inválido.' });
    return;
  }

  if (typeof error.status === 'number' && error.status >= 400 && error.status <= 499) {
    response.status(error.status).json({ message: GENERIC_CLIENT_MESSAGE });
    return;
  }

  console.error(error);
  response.status(500).json({ message: GENERIC_SERVER_MESSAGE });
}
