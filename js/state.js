// Single source of truth for form values. State flows one way:
// input event -> set() -> subscribers (preview re-render, validation display).
// Classic script: exposed as TD.state (see js/templates/schema.js on why).

window.TD = window.TD || {};

TD.state = (() => {
  const values = new Map(TD.fields.map((f) => [f.id, f.default]));
  // Repeatable groups (TD.repeatables) hold a variable number of rows, which a
  // flat id -> value Map cannot express. They live in a second store rather
  // than in `values` so that get/set/getAll keep their scalar contract and the
  // export — which knows only scalars — is unaffected.
  const rows = new Map((TD.repeatables || []).map((r) => [r.id, []]));
  const listeners = new Set();

  function get(id) {
    return values.get(id);
  }

  function getAll() {
    return Object.fromEntries(values);
  }

  function set(id, value) {
    if (!values.has(id)) {
      throw new Error(`state.set: unknown field "${id}"`);
    }
    if (values.get(id) === value) {
      return;
    }
    values.set(id, value);
    for (const fn of listeners) {
      fn(id, value);
    }
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  // --- repeatable groups ---------------------------------------------------
  // Rows are plain objects keyed by the group's own field ids. Subscribers are
  // notified with the group id, exactly as for a scalar.

  function spec(groupId) {
    const found = (TD.repeatables || []).find((r) => r.id === groupId);
    if (!found) {
      throw new Error(`state: unknown repeatable group "${groupId}"`);
    }
    return found;
  }

  function getRows(groupId) {
    return rows.get(spec(groupId).id).map((row) => ({ ...row }));
  }

  function getAllRows() {
    const out = {};
    for (const [id, list] of rows) {
      out[id] = list.map((row) => ({ ...row }));
    }
    return out;
  }

  function notify(groupId) {
    for (const fn of listeners) {
      fn(groupId, getRows(groupId));
    }
  }

  function addRow(groupId, values_ = {}) {
    const group = spec(groupId);
    const list = rows.get(group.id);
    if (list.length >= group.max) {
      // Caller should have disabled the control; refusing beats a silent drop.
      throw new Error(`state.addRow: "${groupId}" is limited to ${group.max} rows`);
    }
    const row = {};
    for (const f of group.fields) {
      row[f.id] = Object.hasOwn(values_, f.id) ? values_[f.id] : f.default;
    }
    list.push(row);
    notify(group.id);
    return list.length - 1;
  }

  function removeRow(groupId, index) {
    const list = rows.get(spec(groupId).id);
    if (index < 0 || index >= list.length) {
      throw new Error(`state.removeRow: "${groupId}" has no row ${index}`);
    }
    list.splice(index, 1);
    notify(groupId);
  }

  function setCell(groupId, index, fieldId, value) {
    const group = spec(groupId);
    const row = rows.get(group.id)[index];
    if (!row) {
      throw new Error(`state.setCell: "${groupId}" has no row ${index}`);
    }
    if (!Object.hasOwn(row, fieldId)) {
      throw new Error(`state.setCell: "${groupId}" has no field "${fieldId}"`);
    }
    if (row[fieldId] === value) {
      return;
    }
    row[fieldId] = value;
    notify(group.id);
  }

  return {
    get, getAll, set, subscribe,
    getRows, getAllRows, addRow, removeRow, setCell,
  };
})();
