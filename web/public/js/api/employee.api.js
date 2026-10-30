const REQUEST_TIMEOUT_MS = 10000;
const CONNECTION_ERROR_MESSAGE = 'Não foi possível conectar ao servidor. Tente novamente.';

export class ApiError extends Error {
  constructor({ status, message, errors }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function buildUrl(path) {
  const base = String(globalThis.APP_CONFIG.apiUrl).replace(/\/$/, '');
  return `${base}${path}`;
}

function parsePayload(responseText) {
  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return {};
  }
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: buildUrl(path),
      method,
      data: body === undefined ? undefined : JSON.stringify(body),
      contentType: body === undefined ? undefined : 'application/json; charset=UTF-8',
      timeout: REQUEST_TIMEOUT_MS,
      cache: false,
      dataType: 'text',
      success: (responseText, _textStatus, xhr) => {
        if (xhr.status === 204 || responseText === '') {
          resolve(null);
          return;
        }

        resolve(JSON.parse(responseText));
      },
      error: (xhr, textStatus) => {
        if (textStatus === 'timeout' || xhr.status === 0) {
          reject(new ApiError({
            status: xhr.status || 0,
            message: CONNECTION_ERROR_MESSAGE,
          }));
          return;
        }

        const payload = parsePayload(xhr.responseText);

        reject(new ApiError({
          status: xhr.status,
          message: payload.message || CONNECTION_ERROR_MESSAGE,
          errors: payload.errors,
        }));
      },
    });
  });
}

export const employeeApi = {
  list() {
    return request('GET', '/employees');
  },

  getById(id) {
    return request('GET', `/employees/${encodeURIComponent(id)}`);
  },

  create(employee) {
    return request('POST', '/employees', employee);
  },

  update(id, employee) {
    return request('PUT', `/employees/${encodeURIComponent(id)}`, employee);
  },

  remove(id) {
    return request('DELETE', `/employees/${encodeURIComponent(id)}`);
  },

  listPeriodicities() {
    return request('GET', '/employees/periodicities');
  },
};
