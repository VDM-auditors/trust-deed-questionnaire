// Fields that are computed from other fields rather than typed.
// Fork of 5. Deed/Trust-Deed/js/lib/derive.js — see the note on the forked
// modules in the repo-root CLAUDE.md. Keep the two identical.
//
// There is exactly one today: {{settlor_name}} for the deed, composed from the
// surname and first names J401 section 5 asks for separately. A full name
// cannot be split back reliably ("VAN DER MERWE" would read as first names
// "VAN DER"), so the parts are captured and the whole is composed.
//
// Classic script: exposed as TD.derive (see js/templates/schema.js on why).

window.TD = window.TD || {};

TD.derive = (() => {
  const { get, set, subscribe } = TD.state;

  function settlorName() {
    const first = (get('settlor_first_names') || '').trim();
    const surname = (get('settlor_surname') || '').trim();
    return [first, surname].filter(Boolean).join(' ');
  }

  function apply() {
    set('settlor_name', settlorName());
  }

  function init() {
    subscribe(apply);
    apply();
  }

  return { init };
})();
