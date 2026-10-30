const ALERT_CLASSES = {
  success: 'alert-success',
  danger: 'alert-danger',
};

export function showAlert(type, message) {
  const container = $('#alert-container');
  const alert = $('<div class="alert alert-dismissible fade show" role="alert"></div>');

  alert.addClass(ALERT_CLASSES[type] ?? ALERT_CLASSES.danger);
  alert.append($('<span></span>').text(message));
  alert.append(
    $('<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>'),
  );

  container.empty().append(alert);
}

export function showSuccess(message) {
  showAlert('success', message);
}

export function showError(message) {
  showAlert('danger', message);
}
