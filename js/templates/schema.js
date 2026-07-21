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
    id: 'trust_file_number',
    label: 'Trust file number',
    type: 'text', group: 'trust', default: '',
    hint: 'Leave this empty for a new trust — the Master issues the number. '
        + 'Only fill it in if this trust is already registered.',
  },
  {
    id: 'asset_location',
    label: 'Town where the trust’s assets are',
    type: 'text', group: 'trust', default: '', required: true,
  },
  {
    id: 'trust_duration',
    label: 'How long the trust will run',
    type: 'text', group: 'trust', default: 'INDEFINITE', required: true,
    hint: 'Usually INDEFINITE — leave it as it is unless the trust is meant to '
        + 'end on a set date.',
  },
  {
    id: 'settlor_surname',
    label: 'Surname of the settlor',
    type: 'text', group: 'settlor', default: '', required: true,
    hint: 'Exactly as it appears on the identity document.',
  },
  {
    id: 'settlor_first_names',
    label: 'First names of the settlor',
    type: 'text', group: 'settlor', default: '', required: true,
  },
  {
    // Composed from the two fields above by js/lib/derive.js, never typed —
    // see the same field in 5. Deed/Trust-Deed/js/templates/schema.js for why.
    id: 'settlor_name',
    label: 'Full name of the settlor',
    type: 'text', group: 'settlor', default: '', required: true,
    derived: true,
  },
  {
    id: 'settlor_id',
    label: 'Identity number of the settlor',
    type: 'id', group: 'settlor', default: '', required: true,
  },
  {
    id: 'settlor_nationality',
    label: 'Nationality of the settlor',
    type: 'text', group: 'settlor', default: 'SOUTH AFRICAN', required: true,
  },
  {
    id: 'settlor_is_trustee',
    label: 'The settlor is also one of the trustees',
    type: 'checkbox', group: 'settlor', default: false,
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
    label: 'Beneficiary — full name',
    type: 'text', group: 'beneficiaries', default: '', required: true,
    hint: 'Named in both the income and capital beneficiary clauses, together '
        + 'with his/her children and their children.',
  },
  {
    id: 'husband_beneficiary_id',
    label: 'Beneficiary — identity number',
    type: 'id', group: 'beneficiaries', default: '', required: true,
  },
  {
    id: 'has_second_beneficiary',
    label: 'There is a second beneficiary',
    type: 'checkbox', group: 'beneficiaries', default: false,
    hint: 'Tick this only if the trust has two beneficiaries — a married '
        + 'couple, typically. Most trusts have one.',
  },
  {
    id: 'wife_beneficiary_name',
    label: 'Second beneficiary — full name',
    type: 'text', group: 'beneficiaries', default: '',
    showIf: 'has_second_beneficiary', requiredIf: 'has_second_beneficiary',
  },
  {
    id: 'wife_beneficiary_id',
    label: 'Second beneficiary — identity number',
    type: 'id', group: 'beneficiaries', default: '',
    showIf: 'has_second_beneficiary', requiredIf: 'has_second_beneficiary',
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

// Repeatable groups: a variable number of rows, each row a set of fields.
// Copied verbatim from the generator's schema — same ids, same order, same
// defaults — because the workspace reads these rows straight out of the JSON.
// They reach no {{tag}} in the deed: it names its beneficiaries by position
// and has no wording for an unbounded list. They exist for form J450, which
// prints 25 rows, and only the client knows who those people are.
//
// Beneficiaries 3+ live here rather than the first two being migrated in:
// husband_beneficiary_* and wife_beneficiary_* are tagged inside the deed's
// assets/deed-template.docx, and renaming them would mean re-tagging the Word
// file for no gain. J450 therefore reads rows 1-2 from those scalars and rows
// 3-25 from here.
TD.repeatables = [
  {
    id: 'additional_beneficiaries',
    label: 'Further beneficiaries',
    group: 'beneficiaries',
    // J450 prints 25 rows; the first two are the deed's named beneficiaries.
    max: 23,
    addLabel: 'Add another beneficiary',
    // Row 1 of this list is beneficiary 3 on J450, because the deed's own two
    // beneficiaries occupy rows 1 and 2.
    rowLabel: 'Beneficiary',
    rowOffset: 3,
    hint: 'Only the first two beneficiaries appear in the trust deed. Any '
        + 'added here appear on form J450 alone.',
    fields: [
      {
        id: 'beneficiary_type',
        label: 'Type',
        type: 'select', default: 'INDIVIDUAL',
        options: ['INDIVIDUAL', 'ORGANISATION'],
      },
      { id: 'full_name', label: 'Full names / organisation name', type: 'text', default: '', required: true },
      { id: 'id_number', label: 'ID / passport / registration no.', type: 'text', default: '', required: true },
      { id: 'date_of_birth', label: 'Date of birth', type: 'date', default: '' },
      {
        id: 'is_minor',
        label: 'Minor or mentally incapacitated',
        type: 'select', default: 'NO',
        options: ['NO', 'YES'],
      },
      // J450 wants a guardian only for a minor; it is left to the auditor
      // rather than gated, because the form is also filled for an incapacitated
      // adult whose curator goes in the same column.
      { id: 'guardian_name', label: 'Guardian — full names', type: 'text', default: '' },
      { id: 'guardian_id', label: 'Guardian — ID / passport', type: 'text', default: '' },
    ],
  },
];

TD.repeatableById = new Map(TD.repeatables.map((r) => [r.id, r]));
