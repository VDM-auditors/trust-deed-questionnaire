// Validation gates export. An incomplete or invalid deed must never be
// exportable — a generated legal deed with a wrong or missing identity
// number is the worst failure this app can have.
// Classic script: exposed as TD.validate (see js/templates/schema.js on why).

window.TD = window.TD || {};

TD.validate = (() => {
  const { digitsOnly } = TD.format;

  // 13 digits, plausible YYMMDD birth-date prefix, Luhn check digit.
  function isSaIdValid(raw) {
    const d = digitsOnly(raw);
    if (d.length !== 13) {
      return false;
    }
    const mm = Number(d.slice(2, 4));
    const dd = Number(d.slice(4, 6));
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
      return false;
    }
    let sum = 0;
    for (let i = 0; i < 13; i += 1) {
      let n = Number(d[12 - i]);
      if (i % 2 === 1) {
        n *= 2;
        if (n > 9) {
          n -= 9;
        }
      }
      sum += n;
    }
    return sum % 10 === 0;
  }

  function isEmpty(value) {
    return value === '' || value === null || value === undefined || value === false;
  }

  function isFieldVisible(field, values) {
    return !field.showIf || Boolean(values[field.showIf]);
  }

  function isFieldRequired(field, values) {
    return Boolean(field.required) || (field.requiredIf && Boolean(values[field.requiredIf]));
  }

  // Returns an error message, or null when the field is fine.
  function validateField(field, values) {
    if (!isFieldVisible(field, values)) {
      return null; // hidden fields never block export
    }
    const value = values[field.id];
    if (isEmpty(value)) {
      return isFieldRequired(field, values)
        ? 'Required before the deed can be exported.'
        : null;
    }
    if (field.type === 'id' && !isSaIdValid(value)) {
      return 'Not a valid South African identity number (13 digits, checksum).';
    }
    if (field.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return 'Enter a complete date.';
    }
    return null;
  }

  function validateAll(values) {
    const errors = {};
    for (const field of TD.fields) {
      const error = validateField(field, values);
      if (error) {
        errors[field.id] = error;
      }
    }
    return { errors, ok: Object.keys(errors).length === 0 };
  }

  return { isSaIdValid, isFieldVisible, isFieldRequired, validateField, validateAll };
})();
