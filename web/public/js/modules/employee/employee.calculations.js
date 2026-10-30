import { parseDate, parseTime } from '../../utils/dateTime.js';
import { isValidDate, isValidTime } from './employee.validation.js';

export function calculateWorkedDays(admissionDate, dismissalDate) {
  if (!isValidDate(admissionDate) || !isValidDate(dismissalDate)) {
    return null;
  }

  const admission = parseDate(admissionDate.trim());
  const dismissal = parseDate(dismissalDate.trim());

  if (dismissal.isBefore(admission)) {
    return null;
  }

  const days = dismissal.diff(admission, 'days') + 1;
  return days === 1 ? '1 dia' : `${days} dias`;
}

export function calculateDailyHours(workStart, workEnd) {
  if (!isValidTime(workStart) || !isValidTime(workEnd)) {
    return null;
  }

  const start = parseTime(workStart.trim());
  const end = parseTime(workEnd.trim());

  if (end.isBefore(start)) {
    return null;
  }

  const totalMinutes = end.diff(start, 'minutes');
  const hours = Math.floor(totalMinutes / 60);
  const minutes = String(totalMinutes % 60).padStart(2, '0');

  return `${hours}h ${minutes}min`;
}
