import mongoose from 'mongoose';
import { CLOSING_PERIODICITIES } from './employee.constants.js';

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admissionDate: { type: String, required: true },
  dismissalDate: { type: String, default: null },
  workStart: { type: String, required: true },
  workEnd: { type: String, required: true },
  closingPeriodicity: {
    type: String,
    required: true,
    enum: CLOSING_PERIODICITIES,
  },
});

export const Employee = mongoose.model('Employee', employeeSchema);
