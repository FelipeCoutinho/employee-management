import { employeeApi } from './api/employee.api.js';
import { createEmployeeForm } from './modules/employee/employee.form.js';
import { createEmployeeList } from './modules/employee/employee.list.js';
import {
  buildEmployeeSummary,
  confirmAction,
  initializeModals,
  showEmployeeDetails,
} from './modules/employee/employee.modal.js';
import { showError, showSuccess } from './utils/alert.js';
import { formatDisplayDate } from './utils/dateTime.js';

const form = createEmployeeForm({
  onValidSubmit: saveEmployee,
});

const list = createEmployeeList({
  onView: viewEmployee,
  onEdit: editEmployee,
  onDelete: deleteEmployee,
});

let periodicityRequest = 0;

initializeModals();

$('#retry-periodicities').on('click', () => {
  loadPeriodicities();
});

loadPeriodicities();
list.reload();

async function loadPeriodicities() {
  const currentRequest = ++periodicityRequest;

  try {
    const periodicities = await employeeApi.listPeriodicities();

    if (currentRequest !== periodicityRequest) {
      return;
    }

    form.setPeriodicities(periodicities);
    form.enable();
    $('#periodicity-error').addClass('d-none');
  } catch {
    if (currentRequest !== periodicityRequest) {
      return;
    }

    form.disable();
    $('#periodicity-error').removeClass('d-none');
  }
}

async function viewEmployee(id) {
  try {
    const employee = await employeeApi.getById(id);
    showEmployeeDetails(employee);
  } catch (error) {
    await handleLookupError(error, id);
  }
}

async function editEmployee(id) {
  try {
    const employee = await employeeApi.getById(id);
    form.fill(employee);
  } catch (error) {
    await handleLookupError(error, id);
  }
}

async function deleteEmployee(employee) {
  const result = await confirmAction({
    title: 'Excluir funcionário',
    lines: [
      { label: 'Nome', value: employee.name },
      { label: 'Data de admissão', value: formatDisplayDate(employee.admissionDate) },
    ],
    question: 'Deseja realmente excluir?',
    tone: 'danger',
    pendingLabel: 'Excluindo...',
    action: () => employeeApi.remove(employee.id),
  });

  if (!result.confirmed) {
    return;
  }

  if (result.error) {
    await handleLookupError(result.error, employee.id);
    return;
  }

  showSuccess('Funcionário excluído com sucesso.');

  if (form.getEditingId() === employee.id) {
    form.reset();
  }

  await list.reload();
}

async function saveEmployee(values, editingId) {
  const isEditing = Boolean(editingId);
  const result = await confirmAction({
    title: isEditing ? 'Salvar alterações' : 'Cadastrar funcionário',
    lines: buildEmployeeSummary(values),
    question: isEditing
      ? 'Deseja realmente salvar as alterações?'
      : 'Deseja realmente cadastrar?',
    pendingLabel: 'Salvando...',
    action: () => (
      isEditing
        ? employeeApi.update(editingId, toPayload(values))
        : employeeApi.create(toPayload(values))
    ),
  });

  if (!result.confirmed) {
    return;
  }

  if (result.error) {
    handleSaveError(result.error, isEditing);
    return;
  }

  showSuccess(
    isEditing
      ? 'Funcionário atualizado com sucesso.'
      : 'Funcionário cadastrado com sucesso.',
  );
  form.reset();
  await list.reload();
}

function handleSaveError(error, isEditing) {
  if (error.status === 400 && Array.isArray(error.errors) && error.errors.length > 0) {
    form.showErrors(error.errors);
    return;
  }

  showError(error.message);

  if (error.status === 404 && isEditing) {
    form.reset();
    list.reload();
  }
}

async function handleLookupError(error, id) {
  showError(error.message);

  if (error.status === 404) {
    form.resetIfEditing(id);
    await list.reload();
  }
}

function toPayload(values) {
  return {
    name: values.name.trim(),
    admissionDate: values.admissionDate,
    dismissalDate: values.dismissalDate ? values.dismissalDate : null,
    workStart: values.workStart,
    workEnd: values.workEnd,
    closingPeriodicity: values.closingPeriodicity,
  };
}
