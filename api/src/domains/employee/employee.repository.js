import { Employee } from './employee.model.js';

export class EmployeeRepository {
  findAll() {
    return Employee.find().sort({ admissionDate: 1, _id: 1 }).lean();
  }

  findById(id) {
    return Employee.findById(id).lean();
  }

  async create(data) {
    const employee = await Employee.create(data);
    return employee.toObject();
  }

  update(id, data) {
    return Employee.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  deleteById(id) {
    return Employee.findByIdAndDelete(id).lean();
  }
}
