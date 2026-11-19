// Минимальная логика учебных форм: данные не отправляются на сервер.
const orderDialog = document.getElementById('order-dialog');
const orderForm = document.getElementById('order-form');
const successMessage = document.getElementById('success-message');
const selectedProductInput = document.getElementById('selected-product');

function getValidationMessage(field) {
  const { validity } = field;

  if (validity.valueMissing) {
    if (field.type === 'checkbox') return 'Подтвердите согласие, чтобы продолжить.';
    if (field.tagName === 'SELECT') return 'Выберите тему заявки.';
    return 'Заполните это поле.';
  }
  if (validity.typeMismatch) return 'Укажите адрес электронной почты в формате name@example.ru.';
  if (validity.patternMismatch) return 'Введите телефон в формате +7 (900) 123-45-67.';
  if (validity.tooShort) return `Введите хотя бы ${field.minLength} символа.`;
  return field.validationMessage;
}

function setFieldInvalid(field, invalid) {
  const fieldClass = {
    INPUT: 'order-form__input',
    SELECT: 'order-form__select',
    TEXTAREA: 'order-form__textarea',
  }[field.tagName];

  if (fieldClass) {
    field.classList.toggle(`${fieldClass}--error`, invalid);
  }

  const errorId = `${field.id}-error`;
  const descriptions = (field.getAttribute('aria-describedby') || '').split(/\s+/)
    .filter((id) => id && id !== errorId);
  let error = document.getElementById(errorId);

  if (invalid) {
    if (!error) {
      error = document.createElement('p');
      error.className = 'order-form__error';
      error.id = errorId;
      field.closest('.order-form__field').append(error);
    }
    error.textContent = getValidationMessage(field);
    field.setAttribute('aria-invalid', 'true');
    descriptions.push(errorId);
  } else {
    error?.remove();
    field.removeAttribute('aria-invalid');
  }

  if (descriptions.length) {
    field.setAttribute('aria-describedby', descriptions.join(' '));
  } else {
    field.removeAttribute('aria-describedby');
  }
}

function clearErrors() {
  orderForm.querySelectorAll('[aria-invalid]').forEach((field) => {
    setFieldInvalid(field, false);
  });
}

// Модальное окно есть только на главной. Страница заявки работает независимо.
if (orderDialog) {
  const productLabel = document.getElementById('selected-product-label');

  orderDialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;

    const controls = Array.from(orderForm.elements)
      .filter((field) => !field.disabled && field.type !== 'hidden' && field.tabIndex >= 0);
    const first = controls[0];
    const last = controls.at(-1);

    if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.querySelectorAll('.product-card__button[data-product], [data-open-order]').forEach((button) => {
    button.addEventListener('click', () => {
      clearErrors();
      successMessage.hidden = true;
      const product = button.dataset.product || '';
      selectedProductInput.value = product;
      productLabel.textContent = product ? `Выбранный товар: ${product}` : '';
      productLabel.hidden = !product;
      orderDialog.showModal();
    });
  });

  document.getElementById('close-order-dialog').addEventListener('click', () => {
    orderDialog.close();
  });
}

// Подставляем только один из товаров, уже заданных в HTML, без вставки HTML из URL.
if (selectedProductInput instanceof HTMLSelectElement) {
  const product = new URLSearchParams(window.location.search).get('product');
  if (product && Array.from(selectedProductInput.options).some((option) => option.value === product)) {
    selectedProductInput.value = product;
    document.getElementById('order-topic').value = 'product';
  }
}

if (orderForm) {
  orderForm.addEventListener('input', (event) => {
    const field = event.target;
    if (field.hasAttribute('aria-invalid')) {
      setFieldInvalid(field, !field.validity.valid);
    }
    successMessage.hidden = true;
  });

  orderForm.addEventListener('reset', () => {
    clearErrors();
    successMessage.hidden = true;
  });

  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();

    const invalidFields = Array.from(orderForm.elements)
      .filter((field) => field.willValidate && !field.validity.valid);
    if (invalidFields.length) {
      invalidFields.forEach((field) => setFieldInvalid(field, true));
      invalidFields[0].focus();
      return;
    }

    // reset вызывает свой обработчик, поэтому сообщение показываем после очистки.
    orderForm.reset();
    successMessage.textContent = 'Заявка проверена. В учебной версии данные не отправляются на сервер.';
    successMessage.hidden = false;
    if (orderDialog) {
      orderDialog.close();
    }
    successMessage.focus();
  });
}
