// The field contract. These ids are shared verbatim by the form, the preview
// blocks in deed.js and the {{tags}} inside assets/deed-template.docx.
// A tag in the .docx with no field here — or the reverse — is a bug.
// The placeholder -> field mapping is recorded in docs/field-map.md.
//
// Every identity/name field defaults to EMPTY on purpose: the source template
// contained a previous client's personal data, and nothing of it may ever
// survive into generated output. Export is blocked until all required fields
// validate (js/lib/validate.js).
//
// Classic script (not an ES module): browsers refuse module imports on
// file:// URLs, and double-clicking index.html must work. Everything hangs
// off the window.TD namespace; index.html loads the files in dependency order.

window.TD = window.TD || {};

TD.groups = [
  { id: 'deed_type', label: 'Type of deed' },
  { id: 'trust', label: 'The trust' },
  { id: 'settlor', label: 'Settlor' },
  { id: 'trustees', label: 'Trustees' },
  { id: 'beneficiaries', label: 'Beneficiaries' },
  { id: 'vesting', label: 'Vesting — clause 18.1' },
];

// type: 'text' | 'textarea' | 'id' (SA identity number) | 'date' | 'checkbox'
// required: always required. requiredIf / showIf: id of a checkbox field.
TD.fields = [
  {
    id: 'is_replacement_deed',
    label: 'This deed replaces an earlier trust deed',
    type: 'checkbox', group: 'deed_type', default: false,
    hint: 'Adds the opening paragraph stating that this deed replaces the '
        + 'original trust deed and any addendums, in their entirety.',
  },
  {
    id: 'original_deed_date',
    label: 'Date of the original trust deed',
    type: 'date', group: 'deed_type', default: '',
    showIf: 'is_replacement_deed', requiredIf: 'is_replacement_deed',
  },
  {
    id: 'preamble_extra',
    label: 'Further wording for the replacement paragraph',
    type: 'textarea', group: 'deed_type', default: '',
    showIf: 'is_replacement_deed',
    hint: 'Optional. Appended to the end of the opening paragraph, inside the '
        + 'same box — for anything else this deed must record about what it '
        + 'replaces.',
  },
  {
    id: 'trust_name',
    label: 'Name of the trust',
    type: 'text', group: 'trust', default: '', required: true,
    hint: 'Clause 2: “The trust shall be known as: …”',
  },
  {
    id: 'settlor_name',
    label: 'Full name of the settlor',
    type: 'text', group: 'settlor', default: '', required: true,
  },
  {
    id: 'settlor_id',
    label: 'Identity number of the settlor',
    type: 'id', group: 'settlor', default: '', required: true,
  },
  {
    id: 'first_trustee_name',
    label: 'Trustee 1 — full name',
    type: 'text', group: 'trustees', default: '', required: true,
    hint: 'Appears in the parties block and again in clause 4.1.',
  },
  {
    id: 'first_trustee_id',
    label: 'Trustee 1 — identity number',
    type: 'id', group: 'trustees', default: '', required: true,
  },
  {
    id: 'husband_beneficiary_name',
    label: 'Beneficiary (Mr.) — full name',
    type: 'text', group: 'beneficiaries', default: '', required: true,
    hint: 'Named in both the income and capital beneficiary clauses, together '
        + 'with the children born out of the marriage and their children.',
  },
  {
    id: 'husband_beneficiary_id',
    label: 'Beneficiary (Mr.) — identity number',
    type: 'id', group: 'beneficiaries', default: '', required: true,
  },
  {
    id: 'wife_beneficiary_name',
    label: 'Beneficiary (Mrs.) — full name',
    type: 'text', group: 'beneficiaries', default: '', required: true,
  },
  {
    id: 'wife_beneficiary_id',
    label: 'Beneficiary (Mrs.) — identity number',
    type: 'id', group: 'beneficiaries', default: '', required: true,
  },
  {
    id: 'intestate_heirs_name',
    label: 'Intestate heirs of — full name',
    type: 'text', group: 'vesting', default: '', required: true,
    hint: 'Clause 18.1: if all beneficiaries and their descendants have died, '
        + 'the fund is held for the intestate heirs of this person. Usually '
        + 'one of the beneficiaries above — confirm with the drafter.',
  },
  {
    id: 'intestate_heirs_id',
    label: 'Intestate heirs of — identity number',
    type: 'id', group: 'vesting', default: '', required: true,
  },
];

TD.fieldById = new Map(TD.fields.map((f) => [f.id, f]));
