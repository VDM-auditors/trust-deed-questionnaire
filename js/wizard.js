// Step navigation: one group per screen, progress bar, and the gate that stops
// a client walking past an unanswered required field.
//
// Classic script: exposed as TD.q.wizard (see js/templates/schema.js on why).

window.TD = window.TD || {};
TD.q = TD.q || {};

TD.q.wizard = (() => {
  const { subscribe } = TD.state;

  let steps = [];
  let sections = [];
  let index = 0;
  let els = {};
  let reviewBody;
  let painted = false;

  function isReview(step) {
    return step.id === TD.q.steps.REVIEW_ID;
  }

  function buildSection(step) {
    const section = document.createElement('section');
    section.className = 'q-step';
    section.dataset.step = step.id;
    section.hidden = true;

    const heading = document.createElement('h2');
    heading.textContent = step.title;
    heading.tabIndex = -1; // focus target on step change, not a tab stop
    section.appendChild(heading);

    if (step.intro) {
      const intro = document.createElement('p');
      intro.className = 'q-intro';
      intro.textContent = step.intro;
      section.appendChild(intro);
    }

    if (isReview(step)) {
      reviewBody = document.createElement('div');
      reviewBody.className = 'review';
      section.appendChild(reviewBody);
    } else {
      TD.q.form.buildStep(section, step);
      if (step.id === TD.q.steps.TRUSTEES_ID) {
        TD.q.trustees.mount(section);
      }
    }

    return section;
  }

  function goToGroup(groupId) {
    const at = steps.findIndex((s) => s.id === groupId);
    if (at !== -1) {
      go(at);
    }
  }

  function renderReview() {
    TD.q.review.render(reviewBody, goToGroup);
  }

  function paint() {
    const step = steps[index];

    sections.forEach((section, i) => {
      section.hidden = i !== index;
    });

    if (isReview(step)) {
      renderReview();
    }

    els.stepCount.textContent = `Step ${index + 1} of ${steps.length} · ${step.title}`;
    els.progress.style.width = `${((index + 1) / steps.length) * 100}%`;
    els.back.hidden = index === 0;
    els.next.hidden = isReview(step);
    if (els.exportBtn) els.exportBtn.hidden = !isReview(step);
    els.blocker.hidden = true;

    window.scrollTo({ top: 0 });

    // Moving to a step is silent otherwise: the card never moves, so a screen
    // reader would read nothing. Focus the heading rather than the first input,
    // so the client hears the question before its first label. Not on the very
    // first paint — nobody has navigated anywhere yet, and stealing focus on
    // load would only fight whatever the browser restored.
    if (painted) {
      const heading = sections[index].querySelector('h2');
      if (heading) {
        heading.focus();
      }
    }
    painted = true;
  }

  function go(next) {
    index = Math.min(Math.max(next, 0), steps.length - 1);
    paint();
  }

  // Extra trustees are gated with the rest of their step, but they are not
  // schema fields, so their errors come from TD.q.trustees (see trustees.js).
  function stepErrors(step) {
    const errors = TD.q.form.stepErrors(step);
    if (step.id === TD.q.steps.TRUSTEES_ID) {
      TD.q.trustees.markTouched();
      errors.push(...TD.q.trustees.errors());
    }
    return errors;
  }

  function attemptNext() {
    const step = steps[index];
    TD.q.form.markStepTouched(step);
    TD.q.form.refresh(sections[index], step);

    const errors = stepErrors(step);
    if (errors.length > 0) {
      els.blocker.hidden = false;
      els.blocker.textContent = errors.length === 1
        ? 'One answer on this page still needs attention.'
        : `${errors.length} answers on this page still need attention.`;
      const focused = TD.q.form.focusFirstInvalid(sections[index], step);
      if (!focused && step.id === TD.q.steps.TRUSTEES_ID) {
        TD.q.trustees.focusFirstInvalid();
      }
      return;
    }
    go(index + 1);
  }

  function init(options) {
    els = options;
    steps = TD.q.steps.all();
    sections = steps.map(buildSection);
    for (const section of sections) {
      els.container.appendChild(section);
    }

    els.next.addEventListener('click', attemptNext);
    els.back.addEventListener('click', () => go(index - 1));

    if (els.exportBtn) {
      els.exportBtn.addEventListener('click', () => {
        const data = {
          answers: TD.state.getAll(),
          additional_trustees: TD.q.trustees.list()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trust-deed-questionnaire.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // Enter should advance rather than submit — there is nothing to submit to.
    els.form.addEventListener('submit', (event) => {
      event.preventDefault();
      attemptNext();
    });

    // Errors clear as the client types, and showIf visibility follows state
    // rather than step changes — so a repaint hangs off every set(), not just
    // navigation. (No client step carries a showIf toggle now that deed_type is
    // hidden, but the schema owns that, not this file.)
    subscribe(() => {
      const step = steps[index];
      if (isReview(step)) {
        renderReview();
      } else {
        TD.q.form.refresh(sections[index], step);
      }
    });

    go(0);
  }

  return { init };
})();
