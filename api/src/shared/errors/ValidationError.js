import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(errors) {
    super('Dados inválidos.', 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
