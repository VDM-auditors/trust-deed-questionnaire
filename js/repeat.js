// Renders a repeatable group (TD.repeatables) as a list of removable cards,
// and binds its cells to TD.state.setCell.
//
// This is the questionnaire's counterpart to the generator's js/form-repeat.js,
// and separate for the same reason js/qform.js is separate from js/form.js: the
// auditor's pane shows errors on blur, whereas here a step is gated and a row's
// errors appear when the client tries to leave the step. Same schema, same
// state; different moment of truth. The rows themselves are identical objects,
// so what the client fills in here is what the workspace reads back.
//
// Unlike js/trustees.js these ARE in TD.state — the deed has no wording for a
// third beneficiary, but form J450 has 25 numbered rows and needs no new
// wording to use them, so these answers do reach a generated document.
//
// Classic script: exposed as TD.q.repeat (see js/templates/schema.js on why).

window.TD = window.TD || {};
TD.q = TD.q || {};

TD.q.repeat = (() => {
  const { getRows, addRow, removeRow, setCell } = TD.state;

  // One mounted group. The questionnaire only has beneficiaries today, but
  // nothing here knows that.
  function mount(section, spec) {
    // Errors show only once a row has been touched, matching TD.q.form: a card
    // added a second ago should not already be red. Held per row and spliced
    // with it, so removing a card cannot slide its red onto its neighbour.
    let touched = getRows(spec.id).map(() => new Set());
    let rendered = -1;

    const block = document.createElement('div');
    block.className = 'trustee-extras';

    if (spec.hint) {
      const hint = document.createElement('p');
      hint.className = 'q-hint';
      hint.textContent = spec.hint;
      block.appendChild(hint);
    }

    const listEl = document.createElement('ol');
    listEl.className = 'trustee-list';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-add'; // deliberately not .btn — that is the nav pair
    addBtn.textContent = spec.addLabel;

    const countEl = document.createElement('p');
    countEl.className = 'q-hint';
    countEl.hidden = true;
    countEl.textContent = `That is the most this form takes — form J450 has room `
      + `for ${spec.max + spec.rowOffset - 1} beneficiaries in total.`;

    // The row's own rule, not the schema's: these are J450 columns, and
    // id_number is a passport or registration number as often as it is an SA
    // identity number, so it is never checksummed here.
    function cellError(field, value) {
      if (field.required && String(value ?? '').trim() === '') {
        return `${field.label} is needed for this beneficiary, or remove them.`;
      }
      return '';
    }

    function errors() {
      return getRows(spec.id).flatMap(
        (row) => spec.fields.map((f) => cellError(f, row[f.id])).filter(Boolean),
      );
    }

    function repaintErrors() {
      getRows(spec.id).forEach((row, index) => {
        for (const field of spec.fields) {
          const wrap = listEl.querySelector(`[data-cell="${index}-${field.id}"]`);
          if (!wrap) {
            continue;
          }
          const message = touched[index] && touched[index].has(field.id)
            ? cellError(field, row[field.id])
            : '';
          const error = wrap.querySelector('.q-error');
          error.hidden = !message;
          error.textContent = message;
          wrap.classList.toggle('invalid', Boolean(message));
        }
      });
    }

    function cellInput(field, value) {
      if (field.type === 'select') {
        const select = document.createElement('select');
        for (const option of field.options) {
          const el = document.createElement('option');
          el.value = option;
          el.textContent = option;
          select.appendChild(el);
        }
        select.value = value;
        return select;
      }
      const input = document.createElement('input');
      input.type = field.type === 'date' ? 'date' : 'text';
      input.autocomplete = 'off';
      input.value = value ?? '';
      return input;
    }

    function cell(field, row, index) {
      const wrap = document.createElement('div');
      wrap.className = 'q-field';
      wrap.dataset.cell = `${index}-${field.id}`;

      const input = cellInput(field, row[field.id]);
      input.id = `q-row-${spec.id}-${index}-${field.id}`;

      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.textContent = field.label;
      if (field.required) {
        label.appendChild(Object.assign(document.createElement('span'), {
          className: 'req',
          textContent: 'required',
        }));
      }

      const error = document.createElement('p');
      error.className = 'q-error';
      error.hidden = true;

      const event = field.type === 'select' ? 'change' : 'input';
      input.addEventListener(event, () => {
        setCell(spec.id, index, field.id, input.value);
        repaintErrors();
      });
      input.addEventListener('blur', () => {
        touched[index].add(field.id);
        repaintErrors();
      });

      wrap.append(label, input, error);
      return wrap;
    }

    function card(row, index) {
      const item = document.createElement('li');
      item.className = 'trustee-card';

      const head = document.createElement('div');
      head.className = 'trustee-head';

      const heading = document.createElement('h3');
      // Rows 1 and 2 are the two beneficiaries named on the previous fields, so
      // this list starts at 3 — the number this person carries on form J450.
      heading.textContent = `${spec.rowLabel} ${index + spec.rowOffset}`;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn-link';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        touched.splice(index, 1);
        removeRow(spec.id, index);
        addBtn.focus();
      });

      head.append(heading, remove);
      item.appendChild(head);
      for (const field of spec.fields) {
        item.appendChild(cell(field, row, index));
      }
      return item;
    }

    // Rebuilding on every keystroke would destroy the caret, so the list is
    // only rebuilt when the number of rows changes — the one thing that can
    // change its structure. Cell indices are positional, so a rebuild is also
    // what renumbers them after a removal.
    function render() {
      const rows = getRows(spec.id);
      if (rows.length !== rendered) {
        listEl.replaceChildren(...rows.map((row, i) => card(row, i)));
        listEl.hidden = rows.length === 0;
        rendered = rows.length;
      }
      addBtn.hidden = rows.length >= spec.max;
      countEl.hidden = rows.length < spec.max;
      repaintErrors();
    }

    addBtn.addEventListener('click', () => {
      if (getRows(spec.id).length >= spec.max) {
        return;
      }
      touched.push(new Set());
      const index = addRow(spec.id);
      const input = listEl.querySelector(`#q-row-${spec.id}-${index}-${spec.fields[0].id}`);
      if (input) {
        input.focus();
      }
    });

    block.append(listEl, addBtn, countEl);
    section.appendChild(block);

    TD.state.subscribe((id) => {
      if (id === spec.id) {
        render();
      }
    });
    render();

    // Called when the client tries to leave the step: every cell counts as
    // touched from here on, so anything left blank turns red.
    function markTouched() {
      touched = getRows(spec.id).map(() => new Set(spec.fields.map((f) => f.id)));
      repaintErrors();
    }

    function focusFirstInvalid() {
      const rows = getRows(spec.id);
      for (let i = 0; i < rows.length; i += 1) {
        const bad = spec.fields.find((f) => cellError(f, rows[i][f.id]));
        if (bad) {
          const input = listEl.querySelector(`#q-row-${spec.id}-${i}-${bad.id}`);
          if (input) {
            input.focus();
          }
          return true;
        }
      }
      return false;
    }

    return { errors, markTouched, focusFirstInvalid };
  }

  return { mount };
})();
