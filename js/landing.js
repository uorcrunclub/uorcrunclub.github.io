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
  
// Populate today's route tile
  
    async function loadTodayRoute() {
    const tile = root.getElementById('todayRouteTile');
    const title = root.getElementById('todayRouteTitle');
    const text = root.getElementById('todayRouteText');

    if (!tile || !title || !text) return;

    try {
      const response = await fetch('json/routes.json', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Unable to load routes.json');
      }

      const data = await response.json();

      const today = new Date();
      const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
      ].join('-');

      const routeKey = data.scheduleOverrides && data.scheduleOverrides[todayKey];

      if (!routeKey || !data.routes || !data.routes[routeKey]) {
        title.textContent = 'Today’s Route';
        text.textContent = 'No scheduled run route is posted for today.';
        tile.removeAttribute('href');
        tile.removeAttribute('target');
        tile.removeAttribute('rel');
        tile.hidden = false;
        tile.classList.add('landing-link-disabled');
        return;
      }

      const route = data.routes[routeKey];

      title.textContent = route.name || 'Today’s Route';
      text.textContent = route.description || 'Open today’s route in RunGo.';
      tile.href = route.url;
      tile.target = '_blank';
      tile.rel = 'noopener noreferrer';
      tile.hidden = false;
      tile.classList.remove('landing-link-disabled');
    } catch (error) {
      title.textContent = 'Today’s Route';
      text.textContent = 'Route information is unavailable right now.';
      tile.removeAttribute('href');
      tile.hidden = false;
      tile.classList.add('landing-link-disabled');
    }
  }

  loadTodayRoute();
  
})();
