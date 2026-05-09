(() => {
  'use strict';

  const root = document;
  const logo = root.getElementById('landingLogo');

  if (!logo) return;

  const nav = window.location;
  const raf = window.requestAnimationFrame.bind(window);
  const perf = window.performance;

  const pathParts = ['ra', 'ff', 'le', '.', 'ht', 'ml'];
  const targetPath = pathParts.join('');

  const state = {
    touches: [],
    resetTimer: 0
  };

  function now() {
    return perf && typeof perf.now === 'function'
      ? perf.now()
      : Date.now();
  }

  function clearSequence() {
    state.touches.length = 0;

    if (state.resetTimer) {
      window.clearTimeout(state.resetTimer);
      state.resetTimer = 0;
    }
  }

  function scheduleReset() {
    if (state.resetTimer) {
      window.clearTimeout(state.resetTimer);
    }

    state.resetTimer = window.setTimeout(() => {
      clearSequence();
    }, 1600);
  }

  function compactTouches(cutoff) {
    state.touches = state.touches.filter((stamp) => stamp >= cutoff);
  }

  function goAdmin() {
    clearSequence();

    raf(() => {
      nav.assign(targetPath);
    });
  }

  function maybeTriggerSequence() {
    const t = now();
    const windowStart = t - 1500;

    compactTouches(windowStart);

    if (state.touches.length < 5) return false;

    const gaps = [];
    for (let i = 1; i < state.touches.length; i += 1) {
      gaps.push(state.touches[i] - state.touches[i - 1]);
    }

    const fastEnough = gaps.every((gap) => gap > 60 && gap < 500);
    if (!fastEnough) return false;

    const totalSpan = state.touches[state.touches.length - 1] - state.touches[0];
    if (totalSpan < 260 || totalSpan > 1450) return false;

    goAdmin();
    return true;
  }

  function recordTouch() {
    const t = now();

    state.touches.push(t);

    if (state.touches.length > 7) {
      state.touches = state.touches.slice(-7);
    }

    scheduleReset();
    maybeTriggerSequence();
  }

  let pressTimer = 0;
  let pressStartedAt = 0;
  let movedTooFar = false;
  let startX = 0;
  let startY = 0;

  function resetPressState() {
    if (pressTimer) {
      window.clearTimeout(pressTimer);
      pressTimer = 0;
    }

    pressStartedAt = 0;
    movedTooFar = false;
    startX = 0;
    startY = 0;
  }

  logo.addEventListener('pointerup', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;

  recordTouch();
});

logo.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

  logo.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
})();
