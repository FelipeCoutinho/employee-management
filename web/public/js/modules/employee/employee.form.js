import { calculateDailyHours, calculateWorkedDays } from './employee.calculations.js';
import { validateEmployee } from './employee.validation.js';

const DATE_FIELDS = ['admissionDate', 'dismissalDate'];
const INVALID_DATE_MESSAGE = 'Data inválida.';

export function createEmployeeForm({ onValidSubmit }) {
  let editingId = null;
  let editingPeriodicity = '';
  let periodicities = [];

  $('#employee-form').on('submit', async (event) => {
    event.preventDefault();

    const values = readValues();
    const errors = collectErrors(values);

    if (errors.length > 0) {
      showFieldErrors(errors);
      return;
    }

    clearFieldErrors();
    await onValidSubmit(values, editingId);
  });

  $('#cancel-edit').on('click', () => {
    reset();
  });

  $('#admissionDate, #dismissalDate, #workStart, #workEnd').on('input change', () => {
    refreshCalculations();
  });

  $('#employee-form').on('input change', 'input, select', (event) => {
    const field = $(event.target);
    field.removeClass('is-invalid');
    field.siblings('.invalid-feedback').text('');
  });

  function readValues() {
    return {
      name: String($('#name').val() ?? ''),
      admissionDate: String($('#admissionDate').val() ?? ''),
      dismissalDate: String($('#dismissalDate').val() ?? ''),
      workStart: String($('#workStart').val() ?? ''),
      workEnd: String($('#workEnd').val() ?? ''),
      closingPeriodicity: String($('#closingPeriodicity').val() ?? ''),
    };
  }

  function collectErrors(values) {
    const errors = validateEmployee(values, periodicities);

    for (const fieldName of DATE_FIELDS) {
      const input = document.querySelector(`[name="${fieldName}"]`);

      if (!input?.validity?.badInput) {
        continue;
      }

      const existing = errors.find((error) => error.field === fieldName);

      if (existing) {
        existing.message = INVALID_DATE_MESSAGE;
      } else {
        errors.push({ field: fieldName, message: INVALID_DATE_MESSAGE });
      }
    }

    return errors;
  }

  function showFieldErrors(errors) {
    clearFieldErrors();

    for (const error of errors) {
      const field = $(`#employee-form [name="${CSS.escape(error.field)}"]`);

      if (field.length === 0) {
        continue;
      }

      field.addClass('is-invalid');
      field.siblings('.invalid-feedback').text(error.message);
    }

    const firstInvalid = $('#employee-form .is-invalid').first();

    if (firstInvalid.length > 0) {
      firstInvalid.trigger('focus');
    }
  }

  function clearFieldErrors() {
    $('#employee-form .is-invalid').removeClass('is-invalid');
    $('#employee-form .invalid-feedback').text('');
  }

  function refreshCalculations() {
    const values = readValues();
    const days = calculateWorkedDays(values.admissionDate, values.dismissalDate);
    const hours = calculateDailyHours(values.workStart, values.workEnd);

    if (days) {
      $('#worked-days-value').text(days);
      $('#worked-days').removeClass('d-none');
    } else {
      $('#worked-days-value').text('');
      $('#worked-days').addClass('d-none');
    }

    if (hours) {
      $('#daily-hours-value').text(hours);
      $('#daily-hours').removeClass('d-none');
    } else {
      $('#daily-hours-value').text('');
      $('#daily-hours').addClass('d-none');
    }
  }

  function setPeriodicities(values) {
    periodicities = [...values];
    const select = $('#closingPeriodicity');
    const current = editingId ? editingPeriodicity : String(select.val() ?? '');

    select.empty();
    select.append($('<option></option>').attr('value', '').text('Selecione'));

    for (const value of periodicities) {
      select.append($('<option></option>').attr('value', value).text(value));
    }

    if (current) {
      select.val(current);
    }
  }

  function fill(employee) {
    editingId = employee.id;
    editingPeriodicity = employee.closingPeriodicity;
    $('#name').val(employee.name);
    $('#admissionDate').val(employee.admissionDate);
    $('#dismissalDate').val(employee.dismissalDate ?? '');
    $('#workStart').val(employee.workStart);
    $('#workEnd').val(employee.workEnd);
    $('#closingPeriodicity').val(employee.closingPeriodicity);
    clearFieldErrors();
    $('#form-heading').text('Editar funcionário');
    $('#cancel-edit').removeClass('d-none');
    refreshCalculations();
  }

  function reset() {
    editingId = null;
    editingPeriodicity = '';
    document.getElementById('employee-form').reset();
    clearFieldErrors();
    $('#form-heading').text('Cadastrar funcionário');
    $('#cancel-edit').addClass('d-none');
    refreshCalculations();
  }

  function resetIfEditing(id) {
    if (editingId === id) {
      reset();
    }
  }

  return {
    setPeriodicities,
    enable() {
      $('#employee-fields').prop('disabled', false);
    },
    disable() {
      $('#employee-fields').prop('disabled', true);
    },
    fill,
    reset,
    resetIfEditing,
    getEditingId: () => editingId,
    showErrors: showFieldErrors,
    refreshCalculations,
  };
}
