// Entry point: wires the wizard to the page and nothing else.
// Classic script, loaded last (see js/templates/schema.js on why).

window.TD = window.TD || {};

TD.q.wizard.init({
  form: document.getElementById('q-form'),
  container: document.getElementById('q-steps'),
  next: document.getElementById('q-next'),
  back: document.getElementById('q-back'),
  blocker: document.getElementById('q-blocker'),
  stepCount: document.getElementById('q-step-count'),
  progress: document.getElementById('q-progress-bar'),
});
