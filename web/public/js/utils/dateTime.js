export function parseDate(value) {
  return globalThis.moment.utc(value, 'YYYY-MM-DD', true);
}

export function parseTime(value) {
  return globalThis.moment.utc(value, 'HH:mm', true);
}

export function formatDisplayDate(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return '—';
  }

  const parsed = parseDate(value);

  if (!parsed.isValid()) {
    return '—';
  }

  return parsed.format('DD/MM/YYYY');
}
