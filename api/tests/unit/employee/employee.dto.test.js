import { describe, expect, it } from '@jest/globals';
import { toEmployeeInput, toEmployeeOutput } from '../../../src/domains/employee/employee.dto.js';
import { AppError } from '../../../src/shared/errors/AppError.js';
import { ValidationError } from '../../../src/shared/errors/ValidationError.js';

const validBody = {
  name: 'Ana Souza',
  admissionDate: '2020-01-15',
  dismissalDate: '2021-03-01',
  workStart: '08:00',
  workEnd: '17:00',
  closingPeriodicity: 'Mensal',
};

function capture(callback) {
  try {
    callback();
    return null;
  } catch (error) {
    return error;
  }
}

describe('employee dto', () => {
  it('trims text fields, drops unknown fields and normalizes a blank dismissal date', () => {
    expect(toEmployeeInput({
      ...validBody,
      name: '  Ana Souza  ',
      dismissalDate: '   ',
      extra: 'ignored',
      admin: true,
    })).toEqual({
      name: 'Ana Souza',
      admissionDate: '2020-01-15',
      dismissalDate: null,
      workStart: '08:00',
      workEnd: '17:00',
      closingPeriodicity: 'Mensal',
    });
  });

  it.each(['', null, undefined])(
    'converts dismissalDate %p into null',
    (dismissalDate) => {
      const body = { ...validBody };

      if (dismissalDate === undefined) {
        delete body.dismissalDate;
      } else {
        body.dismissalDate = dismissalDate;
      }

      expect(toEmployeeInput(body).dismissalDate).toBeNull();
    },
  );

  it('rejects a missing body and an array with the invalid body message', () => {
    for (const body of [undefined, ['Ana'], null]) {
      const error = capture(() => toEmployeeInput(body));

      expect(error).toBeInstanceOf(AppError);
      expect(error).not.toBeInstanceOf(ValidationError);
      expect(error.status).toBe(400);
      expect(error.message).toBe('Corpo da requisição inválido.');
      expect(error.errors).toBeUndefined();
    }
  });

  it('rejects a text field with the wrong type', () => {
    const error = capture(() => toEmployeeInput({ ...validBody, name: 123 }));

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.status).toBe(400);
    expect(error.errors).toEqual([{ field: 'name', message: 'Deve ser um texto.' }]);
  });

  it('formats the output with id and without _id or __v', () => {
    const output = toEmployeeOutput({
      _id: '507f1f77bcf86cd799439011',
      __v: 0,
      ...validBody,
      dismissalDate: null,
      createdAt: 'ignored',
    });

    expect(output).toEqual({
      id: '507f1f77bcf86cd799439011',
      name: 'Ana Souza',
      admissionDate: '2020-01-15',
      dismissalDate: null,
      workStart: '08:00',
      workEnd: '17:00',
      closingPeriodicity: 'Mensal',
    });
    expect(output).not.toHaveProperty('_id');
    expect(output).not.toHaveProperty('__v');
  });
});
