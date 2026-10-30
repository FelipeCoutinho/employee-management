import { calculateDailyHours, calculateWorkedDays } from './employee.calculations.js';
import { formatDisplayDate } from '../../utils/dateTime.js';

let confirmModal;
let detailsModal;
let busy = false;
let pendingAction = null;
let settleRequest = null;

export function initializeModals() {
  confirmModal = new bootstrap.Modal(document.getElementById('confirm-modal'), {
    backdrop: 'static',
    keyboard: false,
  });
  detailsModal = new bootstrap.Modal(document.getElementById('details-modal'));

  $('#confirm-modal-confirm').on('click', async () => {
    if (busy || !pendingAction) {
      return;
    }

    const action = pendingAction;
    busy = true;
    setConfirmLocked(true, action.pendingLabel);

    try {
      await action.action();
      finishConfirm({ confirmed: true });
    } catch (error) {
      finishConfirm({ confirmed: true, error });
    }
  });

  $('#confirm-modal-cancel, #confirm-modal-close').on('click', () => {
    if (busy) {
      return;
    }

    finishConfirm({ confirmed: false });
  });
}

export function confirmAction({
  title,
  lines,
  question,
  tone = 'primary',
  pendingLabel,
  action,
}) {
  return new Promise((resolve) => {
    pendingAction = { action, pendingLabel };
    settleRequest = resolve;
    busy = false;

    $('#confirm-modal-title').text(title);

    const body = $('#confirm-modal-body').empty();
    body.append(renderLines(lines));
    body.append($('<p class="mb-0 mt-3"></p>').text(question));

    $('#confirm-modal-confirm')
      .removeClass('btn-primary btn-danger')
      .addClass(tone === 'danger' ? 'btn-danger' : 'btn-primary')
      .text('Confirmar')
      .prop('disabled', false);
    $('#confirm-modal-cancel, #confirm-modal-close').prop('disabled', false);

    confirmModal.show();
  });
}

export function showEmployeeDetails(employee) {
  $('#details-modal-title').text('Detalhes do funcionário');
  $('#details-modal-body').empty().append(renderLines(buildEmployeeSummary(employee)));
  detailsModal.show();
}

export function buildEmployeeSummary(employee) {
  const lines = [
    { label: 'Nome', value: employee.name },
    { label: 'Data de admissão', value: formatDisplayDate(employee.admissionDate) },
    { label: 'Data de demissão', value: formatDisplayDate(employee.dismissalDate) },
    { label: 'Hora de início', value: employee.workStart },
    { label: 'Hora de fim', value: employee.workEnd },
    { label: 'Periodicidade', value: employee.closingPeriodicity },
  ];

  const workedDays = calculateWorkedDays(employee.admissionDate, employee.dismissalDate);

  if (workedDays) {
    lines.push({ label: 'Dias trabalhados', value: workedDays });
  }

  const dailyHours = calculateDailyHours(employee.workStart, employee.workEnd);

  if (dailyHours) {
    lines.push({ label: 'Horas por dia', value: dailyHours });
  }

  return lines;
}

function renderLines(lines) {
  const list = $('<dl class="row mb-0"></dl>');

  for (const line of lines) {
    list.append($('<dt class="col-sm-5"></dt>').text(line.label));
    list.append($('<dd class="col-sm-7"></dd>').text(line.value ?? ''));
  }

  return list;
}

function setConfirmLocked(locked, pendingLabel) {
  $('#confirm-modal-confirm, #confirm-modal-cancel, #confirm-modal-close').prop('disabled', locked);
  $('#confirm-modal-confirm').text(locked ? pendingLabel : 'Confirmar');
}

function finishConfirm(result) {
  const settle = settleRequest;

  busy = false;
  pendingAction = null;
  settleRequest = null;
  setConfirmLocked(false);
  confirmModal.hide();
  settle?.(result);
}
