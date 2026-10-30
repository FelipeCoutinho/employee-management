import { AppError } from '../../shared/errors/AppError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';

const TEXT_FIELDS = [
  'name',
  'admissionDate',
  'dismissalDate',
  'workStart',
  'workEnd',
  'closingPeriodicity',
];

const INVALID_BODY_MESSAGE = 'Corpo da requisição inválido.';
const INVALID_TEXT_MESSAGE = 'Deve ser um texto.';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function toEmployeeInput(body) {
  if (!isPlainObject(body)) {
    throw new AppError(INVALID_BODY_MESSAGE, 400);
  }

  const typeErrors = [];

  for (const field of TEXT_FIELDS) {
    if (!Object.hasOwn(body, field)) {
      continue;
    }

    const value = body[field];

    if (value !== null && typeof value !== 'string') {
      typeErrors.push({ field, message: INVALID_TEXT_MESSAGE });
    }
  }

  if (typeErrors.length > 0) {
    throw new ValidationError(typeErrors);
  }

  const input = { dismissalDate: null };

  for (const field of TEXT_FIELDS) {
    if (!Object.hasOwn(body, field) || body[field] === null) {
      continue;
    }

    const trimmed = body[field].trim();

    if (field === 'dismissalDate') {
      input.dismissalDate = trimmed === '' ? null : trimmed;
      continue;
    }

    input[field] = trimmed;
  }

  return input;
}

export function toEmployeeOutput(employee) {
  return {
    id: String(employee._id),
    name: employee.name,
    admissionDate: employee.admissionDate,
    dismissalDate: employee.dismissalDate ?? null,
    workStart: employee.workStart,
    workEnd: employee.workEnd,
    closingPeriodicity: employee.closingPeriodicity,
  };
}
