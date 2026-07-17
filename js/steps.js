// Step definitions for the questionnaire wizard.
//
// The steps track TD.groups — the questionnaire must never invent a field or a
// grouping of its own, because js/templates/schema.js is the contract shared
// with the deed template. What lives here is only the plain wording a client
// sees instead of the auditor's group label, plus the closing review step.
//
// A group may be dropped from the client's path (HIDDEN below), which is a
// question the client is not asked, not a field the questionnaire has removed:
// the schema keeps it, the generator still shows it, and its default applies.
//
// Classic script: exposed as TD.q.steps (see js/templates/schema.js on why).

window.TD = window.TD || {};
TD.q = TD.q || {};

TD.q.steps = (() => {
  // Groups the client is never asked about. Whether this deed replaces an
  // earlier one is the auditor's call, made in the generator — the client has
  // no way to know, and is_replacement_deed's schema default (false) already
  // describes a new trust. Hidden here means hidden on the review step too.
  const HIDDEN = new Set(['deed_type']);

  // Keyed by group id. A group with no entry falls back to its schema label.
  const COPY = {
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
      intro: 'The trustees administer the trust. Three are needed at minimum: '
           + 'two of your choosing, and one independent trustee. If the trust '
           + 'needs more, you can add them below.',
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
  const TRUSTEES_ID = 'trustees';

  function isHidden(groupId) {
    return HIDDEN.has(groupId);
  }

  function all() {
    const groups = TD.groups.filter((g) => !isHidden(g.id)).map((group) => ({
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

  return { all, isHidden, REVIEW_ID, TRUSTEES_ID };
})();
