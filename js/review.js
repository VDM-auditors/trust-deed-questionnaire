// The closing step: every answer, read-only, for a last look before the client
// is done. Reads TD.state and TD.q.trustees — nothing here writes.
//
// Classic script: exposed as TD.q.review (see js/templates/schema.js on why).

window.TD = window.TD || {};
TD.q = TD.q || {};

TD.q.review = (() => {
  const { getAll } = TD.state;
  const { isFieldVisible } = TD.validate;
  const { formatSaId, formatLongDate, cleanName } = TD.format;

  function displayValue(field, values) {
    const value = values[field.id];
    if (field.type === 'checkbox') {
      return value ? 'Yes' : 'No';
    }
    if (value === '' || value === null || value === undefined) {
      return '—';
    }
    if (field.type === 'id') {
      return formatSaId(value);
    }
    if (field.type === 'date') {
      return formatLongDate(value) || String(value);
    }
    return cleanName(value);
  }

  function row(list, term, value) {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    if (value === '—') {
      dd.classList.add('empty');
    }
    list.append(dt, dd);
  }

  // Trustees the client added beyond the deed's three. Not schema fields —
  // see js/trustees.js for why they are kept apart.
  function addExtraTrustees(list) {
    TD.q.trustees.list().forEach((trustee, i) => {
      row(list, `Additional trustee ${i + 1} — full name`, cleanName(trustee.name) || '—');
      row(list, `Additional trustee ${i + 1} — identity number`, formatSaId(trustee.id) || '—');
    });
  }

  // onEdit(groupId) sends the client back to that step to change an answer.
  function render(container, onEdit) {
    container.textContent = '';
    const values = getAll();
    const groups = TD.groups.filter((g) => !TD.q.steps.isHidden(g.id));

    // Head each block with the wording the client was asked under, not the
    // schema's label — nobody filling this in should meet "clause 18.1".
    const titles = new Map(TD.q.steps.all().map((s) => [s.id, s.title]));

    for (const group of groups) {
      const fields = TD.fields.filter(
        (f) => f.group === group.id && isFieldVisible(f, values),
      );
      if (fields.length === 0) {
        continue;
      }

      const block = document.createElement('section');
      block.className = 'review-group';

      const head = document.createElement('div');
      head.className = 'review-head';

      const heading = document.createElement('h3');
      heading.textContent = titles.get(group.id) || group.label;

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn-link';
      edit.textContent = 'Change';
      edit.addEventListener('click', () => onEdit(group.id));

      head.append(heading, edit);
      block.appendChild(head);

      const list = document.createElement('dl');
      for (const field of fields) {
        row(list, field.label, displayValue(field, values));
      }
      if (group.id === TD.q.steps.TRUSTEES_ID) {
        addExtraTrustees(list);
      }
      block.appendChild(list);
      container.appendChild(block);
    }
  }

  return { render };
})();
