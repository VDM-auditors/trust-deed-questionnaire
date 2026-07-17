// Builds the inputs for one wizard step and binds them to TD.state.
//
// This is the questionnaire's counterpart to js/form.js. It is deliberately
// separate rather than shared: the auditor's pane renders every group at once
// and reveals errors on blur, whereas here a step is gated — errors for a step
// appear when the client tries to leave it. Same schema, same state, same
// validator; different moment of truth.
//
// Classic script: exposed as TD.q.form (see js/templates/schema.js on why).

window.TD = window.TD || {};
TD.q = TD.q || {};

TD.q.form = (() => {
  const { set, getAll } = TD.state;
  const { validateField, isFieldVisible } = TD.validate;

  const touched = new Set();

  function inputFor(field) {
    if (field.type === 'textarea') {
      const area = document.createElement('textarea');
      area.id = `q-${field.id}`;
      area.rows = 4;
      return area;
    }
    const input = document.createElement('input');
    input.id = `q-${field.id}`;
    switch (field.type) {
      case 'checkbox':
        input.type = 'checkbox';
        input.checked = Boolean(field.default);
        break;
      case 'date':
        input.type = 'date';
        break;
      case 'id':
        input.type = 'text';
        input.inputMode = 'numeric';
        input.autocomplete = 'off';
        input.maxLength = 16; // 13 digits + spaces
        input.placeholder = '13-digit identity number';
        break;
      default:
        input.type = 'text';
        input.autocomplete = 'off';
    }
    return input;
  }

  function buildField(field) {
    const wrap = document.createElement('div');
    wrap.className = 'q-field';
    wrap.dataset.field = field.id;

    const input = inputFor(field);
    const label = document.createElement('label');
    label.htmlFor = input.id;

    if (field.type === 'checkbox') {
      wrap.classList.add('q-field-checkbox');
      label.append(input, document.createTextNode(field.label));
      wrap.appendChild(label);
    } else {
      label.textContent = field.label;
      wrap.append(label, input);
      if (field.required) {
        label.appendChild(Object.assign(document.createElement('span'), {
          className: 'req',
          textContent: 'required',
        }));
      }
    }

    if (field.hint) {
      const hint = document.createElement('p');
      hint.className = 'q-hint';
      hint.textContent = field.hint;
      wrap.appendChild(hint);
    }

    const error = document.createElement('p');
    error.className = 'q-error';
    error.hidden = true;
    wrap.appendChild(error);

    input.addEventListener('input', () => {
      set(field.id, field.type === 'checkbox' ? input.checked : input.value);
    });
    input.addEventListener('blur', () => {
      touched.add(field.id);
    });

    return wrap;
  }

  // Renders a step's fields into `section`. Returns the ids it owns.
  function buildStep(section, step) {
    for (const field of step.fields) {
      section.appendChild(buildField(field));
    }
    return step.fields.map((f) => f.id);
  }

  // Fields on this step the client can actually see right now — a field hidden
  // by showIf can neither be filled in nor block progress.
  function visibleFields(step) {
    const values = getAll();
    return step.fields.filter((f) => isFieldVisible(f, values));
  }

  // Repaints visibility and error text for one step's fields. Errors show only
  // for fields the client has touched or has already been asked to fix.
  function refresh(section, step) {
    const values = getAll();
    for (const field of step.fields) {
      const wrap = section.querySelector(`[data-field="${field.id}"]`);
      if (!wrap) {
        continue;
      }
      wrap.hidden = !isFieldVisible(field, values);
      const message = validateField(field, values);
      const show = Boolean(message) && touched.has(field.id);
      const error = wrap.querySelector('.q-error');
      error.hidden = !show;
      error.textContent = show ? message : '';
      wrap.classList.toggle('invalid', show);
    }
  }

  // Called when the client tries to leave a step: every visible field counts as
  // touched from here on, so anything left blank turns red instead of silently
  // letting them past.
  function markStepTouched(step) {
    for (const field of visibleFields(step)) {
      touched.add(field.id);
    }
  }

  function stepErrors(step) {
    const values = getAll();
    return visibleFields(step)
      .map((f) => validateField(f, values))
      .filter(Boolean);
  }

  // Returns whether it found something to focus, so the caller can fall
  // through to fields this module does not own (see js/trustees.js).
  function focusFirstInvalid(section, step) {
    const values = getAll();
    const bad = visibleFields(step).find((f) => validateField(f, values));
    if (!bad) {
      return false;
    }
    const input = section.querySelector(`#q-${bad.id}`);
    if (input) {
      input.focus();
    }
    return true;
  }

  return { buildStep, refresh, markStepTouched, stepErrors, focusFirstInvalid };
})();
