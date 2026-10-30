import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env'),
  override: true,
  quiet: true,
});

const { connectDatabase, disconnectDatabase } = await import('./src/config/database.js');
const { Employee } = await import('./src/domains/employee/employee.model.js');

const employees = [
  {
    name: 'Ana Souza',
    admissionDate: '2022-03-14',
    dismissalDate: null,
    workStart: '08:00',
    workEnd: '17:00',
    closingPeriodicity: 'Mensal',
  },
  {
    name: 'Bruno Lima',
    admissionDate: '2021-07-01',
    dismissalDate: '2024-12-20',
    workStart: '09:00',
    workEnd: '18:00',
    closingPeriodicity: 'Bimestral',
  },
  {
    name: 'Carla Mendes',
    admissionDate: '2023-01-09',
    dismissalDate: null,
    workStart: '08:30',
    workEnd: '17:30',
    closingPeriodicity: 'Trimestral',
  },
  {
    name: 'Diego Ferreira',
    admissionDate: '2020-11-02',
    dismissalDate: '2025-06-30',
    workStart: '07:00',
    workEnd: '16:00',
    closingPeriodicity: 'Semestral',
  },
  {
    name: 'Elena Costa',
    admissionDate: '2024-04-15',
    dismissalDate: null,
    workStart: '10:00',
    workEnd: '19:00',
    closingPeriodicity: 'Anual',
  },
];

try {
  await connectDatabase();
  await Employee.deleteMany({});
  const created = await Employee.insertMany(employees);
  console.log(`${created.length} funcionários gravados.`);
} catch (error) {
  console.error('Falha ao gravar o seed.', error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
