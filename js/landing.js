(() => {
  'use strict';

  const logo = document.getElementById('landingLogo');
  if (!logo) return;

  const REQUIRED_TAPS = 5;
  const TAP_WINDOW_MS = 1800;

  let tapCount = 0;
  let resetTimer = null;

  function resetTapSequence() {
    tapCount = 0;

    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }
  }

  function handleSecretTap() {
    tapCount += 1;

    if (resetTimer) {
      clearTimeout(resetTimer);
    }

    resetTimer = setTimeout(() => {
      resetTapSequence();
    }, TAP_WINDOW_MS);

    if (tapCount >= REQUIRED_TAPS) {
      resetTapSequence();

      window.location.href = 'raffle.html';
    }
  }

  logo.addEventListener('pointerup', handleSecretTap);
})();
