import { AppError } from '../errors/AppError.js';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function validateObjectId(request, _response, next) {
  if (!OBJECT_ID_PATTERN.test(request.params.id ?? '')) {
    next(new AppError('Identificador inválido.', 400));
    return;
  }

  next();
}
