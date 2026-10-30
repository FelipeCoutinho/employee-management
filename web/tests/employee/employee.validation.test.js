import { describe, expect, it } from '@jest/globals';
import { validateEmployee } from '../../public/js/modules/employee/employee.validation.js';

const PERIODICITIES = ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];

function validEmployee(overrides = {}) {
  return {
    name: 'Ana Souza',
    admissionDate: '2020-01-15',
    dismissalDate: null,
    workStart: '08:00',
    workEnd: '17:00',
    closingPeriodicity: 'Mensal',
    ...overrides,
  };
}

function errorsFor(overrides) {
  return validateEmployee(validEmployee(overrides), PERIODICITIES);
}

describe('employee validation', () => {
  it('accepts a valid employee, including equal dates and equal times', () => {
    expect(validateEmployee(validEmployee(), PERIODICITIES)).toEqual([]);
    expect(errorsFor({
      admissionDate: '2020-05-10',
      dismissalDate: '2020-05-10',
      workStart: '08:00',
      workEnd: '08:00',
    })).toEqual([]);
  });

  it('accepts an accented name with an apostrophe', () => {
    expect(errorsFor({ name: "José D'Ávila-Souza" })).toEqual([]);
  });

  it('accepts a name with 100 characters and rejects 101', () => {
    expect(errorsFor({ name: 'a'.repeat(100) })).toEqual([]);
    expect(errorsFor({ name: 'a'.repeat(101) })).toContainEqual({
      field: 'name',
      message: 'O nome deve ter no máximo 100 caracteres.',
    });
  });

  it('rejects a name with a digit', () => {
    expect(errorsFor({ name: 'Ana 1' })).toContainEqual({
      field: 'name',
      message: 'O nome não pode conter números.',
    });
    expect(errorsFor({ name: 'Ana\u0662' })).toContainEqual({
      field: 'name',
      message: 'O nome não pode conter números.',
    });
  });

  it('rejects a name without letters', () => {
    expect(errorsFor({ name: '!!!' })).toContainEqual({
      field: 'name',
      message: 'O nome deve conter ao menos uma letra.',
    });
    expect(errorsFor({ name: '   ' })).toContainEqual({
      field: 'name',
      message: 'Campo obrigatório.',
    });
  });

  it('reports every missing required field', () => {
    expect(validateEmployee({}, PERIODICITIES)).toEqual([
      { field: 'name', message: 'Campo obrigatório.' },
      { field: 'admissionDate', message: 'Campo obrigatório.' },
      { field: 'workStart', message: 'Campo obrigatório.' },
      { field: 'workEnd', message: 'Campo obrigatório.' },
      { field: 'closingPeriodicity', message: 'Campo obrigatório.' },
    ]);
  });

  it('accepts dismissal on the day after a daylight-saving midnight gap', () => {
    expect(errorsFor({
      admissionDate: '2018-11-04',
      dismissalDate: '2018-11-05',
    })).toEqual([]);
  });

  it('accepts future admission and dismissal dates', () => {
    expect(errorsFor({
      admissionDate: '2099-01-01',
      dismissalDate: '2099-12-31',
    })).toEqual([]);
  });

  it('rejects a dismissal date before admission', () => {
    expect(errorsFor({
      admissionDate: '2020-05-10',
      dismissalDate: '2020-05-09',
    })).toContainEqual({
      field: 'dismissalDate',
      message: 'A data de demissão não pode ser anterior à data de admissão.',
    });
  });

  it('rejects an invalid calendar date', () => {
    expect(errorsFor({ admissionDate: '2018-02-31' })).toContainEqual({
      field: 'admissionDate',
      message: 'Data inválida.',
    });
  });

  it('rejects an end time before the start time', () => {
    expect(errorsFor({ workStart: '17:00', workEnd: '08:00' })).toContainEqual({
      field: 'workEnd',
      message: 'A hora de fim não pode ser anterior à hora de início.',
    });
  });

  it('rejects an invalid periodicity', () => {
    expect(errorsFor({ closingPeriodicity: 'Semanal' })).toContainEqual({
      field: 'closingPeriodicity',
      message: 'Periodicidade inválida.',
    });
  });

  it('rejects a time outside HH:mm from 00:00 to 23:59', () => {
    expect(errorsFor({ workStart: '8:00' })).toContainEqual({
      field: 'workStart',
      message: 'Horário inválido.',
    });
    expect(errorsFor({ workEnd: '24:00' })).toContainEqual({
      field: 'workEnd',
      message: 'Horário inválido.',
    });
  });

  it('accepts 23:59', () => {
    expect(errorsFor({ workStart: '23:00', workEnd: '23:59' })).toEqual([]);
  });

  it('treats a blank dismissal date as an active employee', () => {
    expect(errorsFor({ dismissalDate: '' })).toEqual([]);
    expect(errorsFor({ dismissalDate: '   ' })).toEqual([]);
  });

  it('runs with the Sao Paulo timezone configured for the suite', () => {
    expect(process.env.TZ).toBe('America/Sao_Paulo');
  });
});
