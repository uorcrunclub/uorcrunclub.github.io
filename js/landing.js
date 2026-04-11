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
    resetTimer: 0,
    armedUntil: 0
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

    if (t > state.armedUntil) {
      clearSequence();
      return;
    }

    state.touches.push(t);

    if (state.touches.length > 7) {
      state.touches = state.touches.slice(-7);
    }

    scheduleReset();
    maybeTriggerSequence();
  }

  function armSequence() {
    state.armedUntil = now() + 2200;
    clearSequence();
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

  logo.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    startX = event.clientX;
    startY = event.clientY;
    movedTooFar = false;
    pressStartedAt = now();

    pressTimer = window.setTimeout(() => {
      if (!movedTooFar) {
        armSequence();
      }
    }, 550);
  });

  logo.addEventListener('pointermove', (event) => {
    if (!pressStartedAt) return;

    const deltaX = Math.abs(event.clientX - startX);
    const deltaY = Math.abs(event.clientY - startY);

    if (deltaX > 18 || deltaY > 18) {
      movedTooFar = true;

      if (pressTimer) {
        window.clearTimeout(pressTimer);
        pressTimer = 0;
      }
    }
  });

  logo.addEventListener('pointerup', () => {
    const heldFor = pressStartedAt ? now() - pressStartedAt : 0;

    if (pressTimer) {
      window.clearTimeout(pressTimer);
      pressTimer = 0;
    }

    if (!movedTooFar && heldFor >= 550) {
      armSequence();
    } else {
      recordTouch();
    }

    pressStartedAt = 0;
    movedTooFar = false;
  });

  logo.addEventListener('pointercancel', resetPressState);
  logo.addEventListener('pointerleave', () => {
    if (pressStartedAt && pressTimer) {
      window.clearTimeout(pressTimer);
      pressTimer = 0;
    }
  });

  logo.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
})();
