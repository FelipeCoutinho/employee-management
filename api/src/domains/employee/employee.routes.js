import { Router } from 'express';
import { validateObjectId } from '../../shared/middlewares/validateObjectId.js';
import { EmployeeController } from './employee.controller.js';

const controller = new EmployeeController();

export const employeeRouter = Router();

// Registered before "/:id" so "periodicities" is not validated as an ObjectId.
employeeRouter.get('/periodicities', controller.listPeriodicities);
employeeRouter.get('/', controller.list);
employeeRouter.get('/:id', validateObjectId, controller.getById);
employeeRouter.post('/', controller.create);
employeeRouter.put('/:id', validateObjectId, controller.update);
employeeRouter.delete('/:id', validateObjectId, controller.remove);
