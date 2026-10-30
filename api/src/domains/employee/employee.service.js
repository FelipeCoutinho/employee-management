import { AppError } from '../../shared/errors/AppError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { CLOSING_PERIODICITIES } from './employee.constants.js';
import { toEmployeeInput, toEmployeeOutput } from './employee.dto.js';
import { EmployeeRepository } from './employee.repository.js';
import { validateEmployee } from './employee.validator.js';

const NOT_FOUND_MESSAGE = 'Funcionário não encontrado.';

export class EmployeeService {
  constructor(repository = new EmployeeRepository()) {
    this.repository = repository;
  }

  async list() {
    const employees = await this.repository.findAll();
    return employees.map(toEmployeeOutput);
  }

  async getById(id) {
    const employee = await this.repository.findById(id);

    if (!employee) {
      throw new AppError(NOT_FOUND_MESSAGE, 404);
    }

    return toEmployeeOutput(employee);
  }

  async create(body) {
    const input = this.#parse(body);
    const created = await this.repository.create(input);
    return toEmployeeOutput(created);
  }

  async update(id, body) {
    const input = this.#parse(body);
    const updated = await this.repository.update(id, input);

    if (!updated) {
      throw new AppError(NOT_FOUND_MESSAGE, 404);
    }

    return toEmployeeOutput(updated);
  }

  async remove(id) {
    const deleted = await this.repository.deleteById(id);

    if (!deleted) {
      throw new AppError(NOT_FOUND_MESSAGE, 404);
    }
  }

  listPeriodicities() {
    return [...CLOSING_PERIODICITIES];
  }

  #parse(body) {
    const input = toEmployeeInput(body);
    const errors = validateEmployee(input, CLOSING_PERIODICITIES);

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return input;
  }
}
