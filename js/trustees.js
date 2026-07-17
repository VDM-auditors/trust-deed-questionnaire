// Trustees beyond the three the deed names by position.
//
// These are deliberately NOT schema fields and NOT in TD.state.
// js/templates/schema.js is the contract shared with the tagged .docx, where
// the trustees sit at fixed tags and clause 4.1 reads "The first trustee shall
// be … the second trustee shall be … the independent trustee shall be …".
// There is no wording for a fourth, so a trustee captured here has nowhere to
// go in a generated deed, and TD.state.set would throw on its id anyway.
//
// So this module keeps the answers in TD.q's own store: the client can give
// them and the review step reads them back, but they reach no deed until
// clause 4.1 gains the wording and the .docx a docxtemplater loop. When that
// happens, these become real fields and this file goes away.
//
// Classic script: exposed as TD.q.trustees (see js/templates/schema.js on why).

window.TD = window.TD || {};
TD.q = TD.q || {};

TD.q.trustees = (() => {
  const { isSaIdValid } = TD.validate;

  // Caps the extras only — the deed's own three are separate fields. A trust
  // needing more than nine trustees in total is a conversation, not a form.
  const MAX = 4;

  let seq = 1;
  const extras = [{ key: `x${seq}`, name: '', id: '', touched: false }];
  let listEl;
  let addBtn;
  let countEl;

  function list() {
    return extras.map(({ name, id }) => ({ name, id }));
  }

  function blank() {
    seq += 1;
    return { key: `x${seq}`, name: '', id: '', touched: false };
  }

  // Both halves are required once a trustee has been added at all: an extra
  // trustee with no name is a mis-click, and one with no ID cannot be verified.
  function errorsFor(trustee) {
    const out = {};
    if (trustee.name.trim() === '') {
      out.name = 'Give this trustee’s full name, or remove them.';
    }
    if (trustee.id.trim() === '') {
      out.id = 'An identity number is needed for every trustee.';
    } else if (!isSaIdValid(trustee.id)) {
      out.id = 'Not a valid South African identity number (13 digits, checksum).';
    }
    return out;
  }

  function errors() {
    return extras.flatMap((t) => Object.values(errorsFor(t)));
  }

  function markTouched() {
    for (const trustee of extras) {
      trustee.touched = true;
    }
    if (listEl) {
      repaintErrors();
    }
  }

  // Used only when no schema field on the step is invalid — otherwise the
  // client is sent to that one first, since it sits above these cards.
  function focusFirstInvalid() {
    for (const trustee of extras) {
      const messages = errorsFor(trustee);
      const key = ['name', 'id'].find((k) => messages[k]);
      if (key) {
        const input = listEl.querySelector(`#q-extra-${trustee.key}-${key}`);
        if (input) {
          input.focus();
        }
        return true;
      }
    }
    return false;
  }

  function field(trustee, key, labelText, build) {
    const wrap = document.createElement('div');
    wrap.className = 'q-field';

    const input = build();
    input.id = `q-extra-${trustee.key}-${key}`;
    input.value = trustee[key];

    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = labelText;

    const error = document.createElement('p');
    error.className = 'q-error';
    error.hidden = true;

    input.addEventListener('input', () => {
      trustee[key] = input.value;
      repaintErrors();
    });
    input.addEventListener('blur', () => {
      trustee.touched = true;
      repaintErrors();
    });

    wrap.append(label, input, error);
    wrap.dataset.extra = `${trustee.key}-${key}`;
    return wrap;
  }

  function card(trustee, position) {
    const item = document.createElement('li');
    item.className = 'trustee-card';

    const head = document.createElement('div');
    head.className = 'trustee-head';

    const heading = document.createElement('h3');
    heading.textContent = `Additional trustee ${position}`;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn-link';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      const at = extras.indexOf(trustee);
      extras.splice(at, 1);
      repaint();
      addBtn.focus();
    });

    head.append(heading, remove);

    const nameField = field(trustee, 'name', 'Full name', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.autocomplete = 'off';
      return input;
    });

    const idField = field(trustee, 'id', 'Identity number', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.maxLength = 16; // 13 digits + spaces
      input.placeholder = '13-digit identity number';
      return input;
    });

    item.append(head, nameField, idField);
    return item;
  }

  // Errors show only once a trustee has been touched, matching TD.q.form:
  // a card added a second ago should not already be red.
  function repaintErrors() {
    for (const trustee of extras) {
      const messages = errorsFor(trustee);
      for (const key of ['name', 'id']) {
        const wrap = listEl.querySelector(`[data-extra="${trustee.key}-${key}"]`);
        if (!wrap) {
          continue;
        }
        const message = trustee.touched ? messages[key] : undefined;
        const error = wrap.querySelector('.q-error');
        error.hidden = !message;
        error.textContent = message || '';
        wrap.classList.toggle('invalid', Boolean(message));
      }
    }
  }

  function repaint() {
    listEl.textContent = '';
    extras.forEach((trustee, i) => listEl.appendChild(card(trustee, i + 1)));
    listEl.hidden = extras.length === 0;
    addBtn.hidden = extras.length >= MAX;
    countEl.hidden = extras.length < MAX;
    repaintErrors();
  }

  function add() {
    if (extras.length >= MAX) {
      return;
    }
    const trustee = blank();
    extras.push(trustee);
    repaint();
    const input = listEl.querySelector(`#q-extra-${trustee.key}-name`);
    if (input) {
      input.focus();
    }
  }

  // Builds the extras UI into the trustees step, under the schema's own three.
  function mount(section) {
    const block = document.createElement('div');
    block.className = 'trustee-extras';

    listEl = document.createElement('ol');
    listEl.className = 'trustee-list';
    listEl.hidden = true;

    addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-add'; // deliberately not .btn — that is the nav pair
    addBtn.textContent = 'Add another trustee';
    addBtn.addEventListener('click', add);

    countEl = document.createElement('p');
    countEl.className = 'q-hint';
    countEl.hidden = true;
    countEl.textContent = `That is the most this form takes (${MAX} beyond the `
      + 'three above). If the trust needs more, tell us in your covering email.';

    block.append(listEl, addBtn, countEl);
    section.appendChild(block);
    repaint();
  }

  return { mount, list, errors, markTouched, focusFirstInvalid };
})();
