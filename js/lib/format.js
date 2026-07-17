// Display formatting. Pure functions; never mutate state.
// Classic script: exposed as TD.format (see js/templates/schema.js on why).

window.TD = window.TD || {};

TD.format = (() => {
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  function digitsOnly(raw) {
    return String(raw ?? '').replace(/\D/g, '');
  }

  // "2005-07-08" -> "8 July 2005", the style used by the deed's preamble.
  function formatLongDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) {
      return '';
    }
    return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  }

  // SA identity numbers are rendered grouped 6-4-3, as in the original deed.
  // Anything that is not 13 digits is returned trimmed, unformatted.
  function formatSaId(raw) {
    const d = digitsOnly(raw);
    if (d.length !== 13) {
      return String(raw ?? '').trim();
    }
    return `${d.slice(0, 6)} ${d.slice(6, 10)} ${d.slice(10)}`;
  }

  function cleanName(raw) {
    return String(raw ?? '').replace(/\s+/g, ' ').trim();
  }

  return { digitsOnly, formatLongDate, formatSaId, cleanName };
})();
