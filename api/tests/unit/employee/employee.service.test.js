import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AppError } from '../../../src/shared/errors/AppError.js';
import { ValidationError } from '../../../src/shared/errors/ValidationError.js';

const repositoryMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteById: jest.fn(),
};

jest.unstable_mockModule('../../../src/domains/employee/employee.repository.js', () => ({
  EmployeeRepository: class EmployeeRepository {
    findAll = repositoryMock.findAll;

    findById = repositoryMock.findById;

    create = repositoryMock.create;

    update = repositoryMock.update;

    deleteById = repositoryMock.deleteById;
  },
}));

const { EmployeeService } = await import('../../../src/domains/employee/employee.service.js');

const employeeId = '507f1f77bcf86cd799439011';

const validEmployee = {
  name: 'Ana Souza',
  admissionDate: '2020-01-15',
  dismissalDate: null,
  workStart: '08:00',
  workEnd: '17:00',
  closingPeriodicity: 'Mensal',
};

describe('employee service', () => {
  beforeEach(() => {
    for (const mock of Object.values(repositoryMock)) {
      mock.mockReset();
    }
  });

  it('returns 404 when the employee does not exist', async () => {
    const service = new EmployeeService();
    repositoryMock.findById.mockResolvedValue(null);
    repositoryMock.update.mockResolvedValue(null);
    repositoryMock.deleteById.mockResolvedValue(null);

    await expect(service.getById(employeeId)).rejects.toMatchObject({
      status: 404,
      message: 'Funcionário não encontrado.',
    });
    await expect(service.update(employeeId, validEmployee)).rejects.toBeInstanceOf(AppError);
    await expect(service.remove(employeeId)).rejects.toMatchObject({ status: 404 });
    expect(repositoryMock.update).toHaveBeenCalledWith(employeeId, validEmployee);
  });

  it('calls the repository only with valid data', async () => {
    const service = new EmployeeService();
    repositoryMock.create.mockResolvedValue({ _id: employeeId, ...validEmployee });

    const created = await service.create({
      ...validEmployee,
      name: '  Ana Souza  ',
      dismissalDate: '',
    });

    expect(repositoryMock.create).toHaveBeenCalledWith(validEmployee);
    expect(created).toMatchObject({ id: employeeId, name: 'Ana Souza', dismissalDate: null });
    expect(created).not.toHaveProperty('_id');

    repositoryMock.create.mockClear();
    await expect(service.create({ ...validEmployee, name: '!!!' })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.create({ ...validEmployee, name: 123 })).rejects.toBeInstanceOf(ValidationError);
    await expect(service.create([])).rejects.toBeInstanceOf(AppError);
    expect(repositoryMock.create).not.toHaveBeenCalled();

    await expect(service.update(employeeId, { ...validEmployee, workEnd: '07:00' }))
      .rejects.toBeInstanceOf(ValidationError);
    expect(repositoryMock.update).not.toHaveBeenCalled();
  });

  it('returns a copy of the periodicities', () => {
    const service = new EmployeeService();
    const periodicities = service.listPeriodicities();

    expect(periodicities).toEqual(['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual']);
    periodicities.push('Semanal');
    expect(service.listPeriodicities()).not.toContain('Semanal');
  });
});
