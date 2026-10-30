import moment from 'moment';

export function parseDate(value) {
  return moment.utc(value, 'YYYY-MM-DD', true);
}

export function parseTime(value) {
  return moment.utc(value, 'HH:mm', true);
}
