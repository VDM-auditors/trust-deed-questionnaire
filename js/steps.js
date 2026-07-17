// Step definitions for the questionnaire wizard.
//
// The steps mirror TD.groups one-for-one — the questionnaire must never invent
// a field or a grouping of its own, because js/templates/schema.js is the
// contract shared with the deed template. What lives here is only the plain
// wording a client sees instead of the auditor's group label, plus the
// closing review step.
//
// Classic script: exposed as TD.q.steps (see js/templates/schema.js on why).

window.TD = window.TD || {};
TD.q = TD.q || {};

TD.q.steps = (() => {
  // Keyed by group id. A group with no entry falls back to its schema label.
  const COPY = {
    deed_type: {
      title: 'Is this a new trust, or a replacement?',
      intro: 'Most trusts are new. Only tick the box below if this deed is '
           + 'replacing a trust deed that already exists.',
    },
    trust: {
      title: 'The trust',
      intro: 'The name the trust will be known by.',
    },
    settlor: {
      title: 'The settlor',
      intro: 'The settlor is the person who donates the founding amount to the '
           + 'trust. Please give the name exactly as it appears on the identity '
           + 'document.',
    },
    trustees: {
      title: 'The trustees',
      intro: 'The trustees administer the trust. Three are needed: two of your '
           + 'choosing, and one independent trustee.',
    },
    beneficiaries: {
      title: 'The beneficiaries',
      intro: 'The people the trust is for. The children born of the marriage, '
           + 'and their children, are covered by the deed automatically — you '
           + 'do not need to name them here.',
    },
    vesting: {
      title: 'If everyone named has died',
      intro: 'The deed must say who inherits in the unlikely event that every '
           + 'beneficiary and all of their descendants have died. Name the '
           + 'person whose intestate heirs would then receive the trust.',
    },
  };

  const REVIEW_ID = '__review';

  function all() {
    const groups = TD.groups.map((group) => ({
      id: group.id,
      title: (COPY[group.id] && COPY[group.id].title) || group.label,
      intro: (COPY[group.id] && COPY[group.id].intro) || '',
      fields: TD.fields.filter((f) => f.group === group.id),
    }));
    groups.push({
      id: REVIEW_ID,
      title: 'Check your answers',
      intro: 'Please read through everything once more. Identity numbers are '
           + 'worth a second look — a wrong digit follows the deed all the way '
           + 'to signature.',
      fields: [],
    });
    return groups;
  }

  return { all, REVIEW_ID };
})();
