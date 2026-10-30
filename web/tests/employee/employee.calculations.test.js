import { describe, expect, it } from '@jest/globals';
import {
  calculateDailyHours,
  calculateWorkedDays,
} from '../../public/js/modules/employee/employee.calculations.js';

describe('employee calculations', () => {
  it('counts both the admission day and the dismissal day', () => {
    expect(calculateWorkedDays('2018-11-04', '2018-11-04')).toBe('1 dia');
    expect(calculateWorkedDays('2018-11-04', '2018-11-05')).toBe('2 dias');
  });

  it('returns null when the dismissal date is empty or before admission', () => {
    expect(calculateWorkedDays('2018-11-04', '')).toBeNull();
    expect(calculateWorkedDays('2018-11-04', null)).toBeNull();
    expect(calculateWorkedDays('2018-11-04', undefined)).toBeNull();
    expect(calculateWorkedDays('2020-05-10', '2020-05-09')).toBeNull();
  });

  it('formats the daily hours with zero-padded minutes', () => {
    expect(calculateDailyHours('08:00', '16:05')).toBe('8h 05min');
    expect(calculateDailyHours('08:00', '17:30')).toBe('9h 30min');
    expect(calculateDailyHours('08:00', '08:00')).toBe('0h 00min');
  });

  it('returns null when the schedule is invalid or crosses midnight', () => {
    expect(calculateDailyHours('17:00', '08:00')).toBeNull();
    expect(calculateDailyHours('08:00', '24:00')).toBeNull();
    expect(calculateDailyHours('24:00', '23:59')).toBeNull();
  });

  it('runs with the Sao Paulo timezone configured for the suite', () => {
    expect(process.env.TZ).toBe('America/Sao_Paulo');
  });
});
