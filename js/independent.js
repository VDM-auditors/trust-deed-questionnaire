// Which of the trustees is the independent trustee.
//
// The independent trustee is the one who deposes the sworn affidavit — they
// sign it, in ink, in front of a commissioner of oaths. Until now this form had
// no way to say who that is: the questionnaire captures a first trustee plus
// extras (see js/trustees.js), and the workspace was left GUESSING, filling the
// deed's independent_trustee_* slot from whichever extra happened to be
// captured second. On a sworn document that guess is unacceptable, so the
// client names the person here and the guess goes away.
//
// Deliberately NOT a schema field. Adding one would widen the fork between this
// form's schema.js and the deed's, which is already the repo's known defect —
// and it would be the wrong shape anyway: the answer is not a value belonging
// to one trustee, it is a choice ACROSS them. It rides in the exported JSON as
// its own top-level key and js/menu/loader.js reads it there.
//
// At most one, zero allowed (user's decision, 20 July 2026): a client who does
// not yet know which trustee will be independent leaves it blank, and the
// affidavit's deponent fields come out empty — a visible omission the auditor
// fills in, rather than a confidently wrong name on a sworn form.
//
// Classic script: exposed as TD.q.independent (see js/templates/schema.js on why).

window.TD = window.TD || {};
TD.q = TD.q || {};

TD.q.independent = (() => {
  const { get, subscribe } = TD.state;
  const { cleanName } = TD.format;

  // null, or { source: 'first' } / { source: 'additional', key }. The extras are
  // held by key rather than index so that removing a card above the chosen one
  // does not silently move the choice onto a different person.
  let choice = null;

  let listEl;
  let emptyEl;
  let warnEl;

  // The trustees this form knows about, in the order the client gave them.
  // Unnamed ones are skipped: an empty card is a mis-click, not a candidate.
  function candidates() {
    const out = [];
    const first = cleanName(get('first_trustee_name') || '');
    if (first.trim() !== '') {
      out.push({ source: 'first', label: 'First trustee', name: first });
    }
    TD.q.trustees.list().forEach((trustee, i) => {
      const name = cleanName(trustee.name || '');
      if (name.trim() !== '') {
        out.push({
          source: 'additional',
          key: trustee.key,
          label: `Additional trustee ${i + 1}`,
          name,
        });
      }
    });
    return out;
  }

  function isChosen(candidate) {
    if (!choice || choice.source !== candidate.source) {
      return false;
    }
    return choice.source === 'first' || choice.key === candidate.key;
  }

  // Clears a choice that no longer points at a named trustee — the client
  // removed that card, or blanked the name.
  function prune(available) {
    if (choice && !available.some(isChosen)) {
      choice = null;
    }
  }

  function option(candidate) {
    const item = document.createElement('li');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = candidate.source === 'first'
      ? 'q-independent-first'
      : `q-independent-${candidate.key}`;
    input.checked = isChosen(candidate);

    // Checkboxes rather than radios, and ticking one clears the rest. A radio
    // group cannot be emptied once touched, and zero is a legitimate answer
    // here; this keeps "at most one" without trapping the client into a choice.
    input.addEventListener('change', () => {
      choice = input.checked
        ? (candidate.source === 'first'
          ? { source: 'first' }
          : { source: 'additional', key: candidate.key })
        : null;
      refresh();
    });

    const label = document.createElement('label');
    label.htmlFor = input.id;

    const who = document.createElement('span');
    who.className = 'independent-name';
    who.textContent = candidate.name;

    const role = document.createElement('span');
    role.className = 'independent-role';
    role.textContent = candidate.label;

    label.append(who, role);
    item.append(input, label);
    return item;
  }

  // Rebuilt wholesale on every change. Safe to do here, unlike the trustee
  // cards: there is no text input in this block, so there is no caret to lose.
  function refresh() {
    if (!listEl) {
      return;
    }
    const available = candidates();
    prune(available);

    listEl.textContent = '';
    available.forEach((candidate) => listEl.appendChild(option(candidate)));
    listEl.hidden = available.length === 0;
    emptyEl.hidden = available.length > 0;

    // Leaving this blank is allowed — "not settled yet" is a real answer — but
    // it was being skipped by accident, and the cost lands downstream: the
    // deed's independent trustee comes through empty and the auditor has to
    // work out who it is. So say the cost here, where the client can fix it.
    // A notice, never a block: TD.q.wizard does not gate on this.
    warnEl.hidden = available.length < 2 || Boolean(choice);
  }

  // What the export writes. null when the client left it blank.
  function selection() {
    const available = candidates();
    prune(available);
    if (!choice) {
      return null;
    }
    if (choice.source === 'first') {
      return { source: 'first' };
    }
    // Resolved to a position only at export time, because the extras array is
    // what the JSON carries and our keys mean nothing outside this session.
    const index = TD.q.trustees.list().findIndex((t) => t.key === choice.key);
    return index === -1 ? null : { source: 'additional', index };
  }

  // The chosen trustee's name, for the review step. '' when none.
  function chosenName() {
    const available = candidates();
    prune(available);
    const found = available.find(isChosen);
    return found ? found.name : '';
  }

  function mount(section) {
    const block = document.createElement('div');
    block.className = 'independent-block';

    const heading = document.createElement('h3');
    heading.textContent = 'Independent trustee';

    const hint = document.createElement('p');
    hint.className = 'q-hint';
    hint.textContent = 'Which of the trustees above is the independent trustee? '
      + 'That is the person who swears the affidavit for the Master. '
      + 'Tick one, or leave all of them blank if it is not settled yet.';

    listEl = document.createElement('ul');
    listEl.className = 'independent-list';
    listEl.hidden = true;

    emptyEl = document.createElement('p');
    emptyEl.className = 'q-hint';
    emptyEl.textContent = 'Name a trustee above and they will appear here.';

    warnEl = document.createElement('p');
    warnEl.className = 'independent-warn';
    warnEl.hidden = true;
    warnEl.textContent = 'You have named more than one trustee but not said which '
      + 'one is independent. Leave it blank only if it is genuinely not decided — '
      + 'otherwise the affidavit comes through unsigned-for and someone has to '
      + 'ask you again.';

    block.append(heading, hint, listEl, emptyEl, warnEl);
    section.appendChild(block);

    // The first trustee's name lives in TD.state, so this list has to follow
    // the client's typing there as well as the extras' own repaints.
    subscribe(() => refresh());
    refresh();
  }

  return { mount, refresh, selection, chosenName };
})();
