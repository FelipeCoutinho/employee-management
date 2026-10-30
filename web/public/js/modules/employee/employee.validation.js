import { parseDate, parseTime } from '../../utils/dateTime.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const REQUIRED_MESSAGE = 'Campo obrigatório.';
const NAME_MAX_LENGTH = 100;

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidDate(value) {
  return readText(value) !== '' && parseDate(readText(value)).isValid();
}

export function isValidTime(value) {
  const text = readText(value);
  return TIME_PATTERN.test(text) && parseTime(text).isValid();
}

function validateName(name, errors) {
  if (!name) {
    errors.push({ field: 'name', message: REQUIRED_MESSAGE });
    return;
  }

  if (name.length > NAME_MAX_LENGTH) {
    errors.push({
      field: 'name',
      message: 'O nome deve ter no máximo 100 caracteres.',
    });
    return;
  }

  if (/\p{Nd}/u.test(name)) {
    errors.push({ field: 'name', message: 'O nome não pode conter números.' });
    return;
  }

  if (!/\p{L}/u.test(name)) {
    errors.push({
      field: 'name',
      message: 'O nome deve conter ao menos uma letra.',
    });
  }
}

function validateAdmissionDate(admissionDate, errors) {
  if (!admissionDate) {
    errors.push({ field: 'admissionDate', message: REQUIRED_MESSAGE });
    return false;
  }

  if (!parseDate(admissionDate).isValid()) {
    errors.push({ field: 'admissionDate', message: 'Data inválida.' });
    return false;
  }

  return true;
}

function validateDismissalDate(dismissalDate, admissionDate, admissionIsValid, errors) {
  if (dismissalDate === null) {
    return;
  }

  const dismissal = parseDate(dismissalDate);

  if (!dismissal.isValid()) {
    errors.push({ field: 'dismissalDate', message: 'Data inválida.' });
    return;
  }

  if (admissionIsValid && dismissal.isBefore(parseDate(admissionDate))) {
    errors.push({
      field: 'dismissalDate',
      message: 'A data de demissão não pode ser anterior à data de admissão.',
    });
  }
}

function validateTimeField(value, field, errors) {
  if (!value) {
    errors.push({ field, message: REQUIRED_MESSAGE });
    return false;
  }

  if (!isValidTime(value)) {
    errors.push({ field, message: 'Horário inválido.' });
    return false;
  }

  return true;
}

function validatePeriodicity(value, periodicities, errors) {
  if (!value) {
    errors.push({ field: 'closingPeriodicity', message: REQUIRED_MESSAGE });
    return;
  }

  if (!periodicities.includes(value)) {
    errors.push({ field: 'closingPeriodicity', message: 'Periodicidade inválida.' });
  }
}

export function validateEmployee(data, periodicities) {
  const errors = [];
  const name = readText(data.name);
  const admissionDate = readText(data.admissionDate);
  const dismissalText = readText(data.dismissalDate);
  const dismissalDate = dismissalText === '' ? null : dismissalText;
  const workStart = readText(data.workStart);
  const workEnd = readText(data.workEnd);
  const closingPeriodicity = readText(data.closingPeriodicity);

  validateName(name, errors);
  const admissionIsValid = validateAdmissionDate(admissionDate, errors);
  validateDismissalDate(dismissalDate, admissionDate, admissionIsValid, errors);

  const startIsValid = validateTimeField(workStart, 'workStart', errors);
  const endIsValid = validateTimeField(workEnd, 'workEnd', errors);

  if (startIsValid && endIsValid && parseTime(workEnd).isBefore(parseTime(workStart))) {
    errors.push({
      field: 'workEnd',
      message: 'A hora de fim não pode ser anterior à hora de início.',
    });
  }

  validatePeriodicity(closingPeriodicity, periodicities, errors);

  return errors;
}
