import { EmployeeService } from './employee.service.js';

export class EmployeeController {
  constructor(service = new EmployeeService()) {
    this.service = service;
  }

  list = async (_request, response) => {
    const employees = await this.service.list();
    response.json(employees);
  };

  getById = async (request, response) => {
    const employee = await this.service.getById(request.params.id);
    response.json(employee);
  };

  create = async (request, response) => {
    const employee = await this.service.create(request.body);
    response.status(201).json(employee);
  };

  update = async (request, response) => {
    const employee = await this.service.update(request.params.id, request.body);
    response.json(employee);
  };

  remove = async (request, response) => {
    await this.service.remove(request.params.id);
    response.status(204).end();
  };

  listPeriodicities = (_request, response) => {
    response.json(this.service.listPeriodicities());
  };
}
