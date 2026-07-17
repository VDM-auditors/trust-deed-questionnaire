// The closing step: every answer, read-only, for a last look before the client
// is done. Reads TD.state only — nothing here writes.
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

  function render(container) {
    container.textContent = '';
    const values = getAll();

    for (const group of TD.groups) {
      const fields = TD.fields.filter(
        (f) => f.group === group.id && isFieldVisible(f, values),
      );
      if (fields.length === 0) {
        continue;
      }

      const block = document.createElement('section');
      block.className = 'review-group';

      const heading = document.createElement('h3');
      heading.textContent = group.label;
      block.appendChild(heading);

      const list = document.createElement('dl');
      for (const field of fields) {
        const term = document.createElement('dt');
        term.textContent = field.label;
        const def = document.createElement('dd');
        def.textContent = displayValue(field, values);
        if (def.textContent === '—') {
          def.classList.add('empty');
        }
        list.append(term, def);
      }
      block.appendChild(list);
      container.appendChild(block);
    }
  }

  return { render };
})();
