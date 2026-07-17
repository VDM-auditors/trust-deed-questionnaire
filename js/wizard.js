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
    }

    return section;
  }

  function paint() {
    const step = steps[index];

    sections.forEach((section, i) => {
      section.hidden = i !== index;
    });

    if (isReview(step)) {
      TD.q.review.render(reviewBody);
    }

    els.stepCount.textContent = `Step ${index + 1} of ${steps.length} · ${step.title}`;
    els.progress.style.width = `${((index + 1) / steps.length) * 100}%`;
    els.back.hidden = index === 0;
    els.next.hidden = isReview(step);
    els.blocker.hidden = true;

    window.scrollTo({ top: 0 });
  }

  function go(next) {
    index = Math.min(Math.max(next, 0), steps.length - 1);
    paint();
  }

  function attemptNext() {
    const step = steps[index];
    TD.q.form.markStepTouched(step);
    TD.q.form.refresh(sections[index], step);

    const errors = TD.q.form.stepErrors(step);
    if (errors.length > 0) {
      els.blocker.hidden = false;
      els.blocker.textContent = errors.length === 1
        ? 'One answer on this page still needs attention.'
        : `${errors.length} answers on this page still need attention.`;
      TD.q.form.focusFirstInvalid(sections[index], step);
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

    // Enter should advance rather than submit — there is nothing to submit to.
    els.form.addEventListener('submit', (event) => {
      event.preventDefault();
      attemptNext();
    });

    // A checkbox can reveal or hide fields on the current step (the replacement
    // deed date), so visibility has to follow state, not just step changes.
    subscribe(() => {
      const step = steps[index];
      if (isReview(step)) {
        TD.q.review.render(reviewBody);
      } else {
        TD.q.form.refresh(sections[index], step);
      }
    });

    go(0);
  }

  return { init };
})();
