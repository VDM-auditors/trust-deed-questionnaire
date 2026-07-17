// Single source of truth for form values. State flows one way:
// input event -> set() -> subscribers (preview re-render, validation display).
// Classic script: exposed as TD.state (see js/templates/schema.js on why).

window.TD = window.TD || {};

TD.state = (() => {
  const values = new Map(TD.fields.map((f) => [f.id, f.default]));
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

  return { get, getAll, set, subscribe };
})();
