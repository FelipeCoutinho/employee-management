import { employeeApi } from '../../api/employee.api.js';
import { formatDisplayDate } from '../../utils/dateTime.js';

export function createEmployeeList({ onView, onEdit, onDelete }) {
  let requestId = 0;

  $('#retry-list').on('click', () => {
    reload();
  });

  async function reload() {
    const currentRequest = ++requestId;

    try {
      const employees = await employeeApi.list();

      if (currentRequest !== requestId) {
        return;
      }

      renderEmployees(employees);
    } catch (error) {
      if (currentRequest !== requestId) {
        return;
      }

      renderError(error.message);
    }
  }

  function renderEmployees(employees) {
    const tbody = $('#employee-table-body').empty();
    $('#list-error').addClass('d-none');

    if (employees.length === 0) {
      $('#empty-message').removeClass('d-none');
      return;
    }

    $('#empty-message').addClass('d-none');

    for (const employee of employees) {
      tbody.append(renderRow(employee));
    }
  }

  function renderError(message) {
    $('#employee-table-body').empty();
    $('#empty-message').addClass('d-none');
    $('#list-error-message').text(message);
    $('#list-error').removeClass('d-none');
  }

  function renderRow(employee) {
    const row = $('<tr></tr>');

    row.append($('<td></td>').text(employee.name));
    row.append($('<td></td>').text(formatDisplayDate(employee.admissionDate)));
    row.append($('<td></td>').text(formatDisplayDate(employee.dismissalDate)));
    row.append($('<td></td>').text(employee.closingPeriodicity));

    const actions = $('<div class="d-flex flex-wrap gap-1"></div>');
    actions.append(actionButton('Ver', 'btn-outline-secondary', () => onView(employee.id)));
    actions.append(actionButton('Editar', 'btn-outline-primary', () => onEdit(employee.id)));
    actions.append(actionButton('Excluir', 'btn-outline-danger', () => onDelete(employee)));
    row.append($('<td></td>').append(actions));

    return row;
  }

  function actionButton(label, style, onClick) {
    return $('<button type="button"></button>')
      .addClass(`btn btn-sm ${style}`)
      .text(label)
      .on('click', onClick);
  }

  return { reload };
}
