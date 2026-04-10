(() => {
  'use strict';

  const {
    escapeHtml,
    qs,
    setHidden,
    showToast,
    removeToast
  } = window.UORC || {};

  const ADMIN_KEY_STORAGE = 'uorcRaffleAdminKey';

  let pendingRequest = null;
  let requestTimeout = null;

  document.addEventListener('DOMContentLoaded', () => {
    const authCard = qs('#authCard');
    const raffleApp = qs('#raffleApp');
    const adminKeyInput = qs('#adminKeyInput');
    const unlockBtn = qs('#unlockBtn');
    const authStatus = qs('#authStatus');

    const winnerCountInput = qs('#winnerCount');
    const drawBtn = qs('#drawBtn');
    const drawAdditionalBtn = qs('#drawAdditionalBtn');
    const redrawSelectedBtn = qs('#redrawSelectedBtn');
    const allowRedraw = qs('#allowRedraw');
    const forgetKeyBtn = qs('#forgetKeyBtn');

    const winnersCard = qs('#winnersCard');
    const redrawBlock = qs('#redrawBlock');
    const winnerList = qs('#winnerList');
    const lastDraw = qs('#lastDraw');

    const raffleTransportForm = qs('#raffleTransportForm');
    const transportAction = qs('#transportAction');
    const transportAdminKey = qs('#transportAdminKey');
    const transportWinnerCount = qs('#transportWinnerCount');
    const selectedKeysContainer = qs('#selectedKeysContainer');

    function getAdminKey() {
      return sessionStorage.getItem(ADMIN_KEY_STORAGE) || '';
    }

    function setAdminKey(value) {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, value);
    }

    function clearAdminKey() {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    }

    function setStatus(element, message, type = '') {
      if (element) {
        element.textContent = '';
        element.className = 'status-text';
      }

      if (!message) {
        removeToast();
        return;
      }

      const toastType =
        type === 'error' ? 'error' :
        type === 'success' ? 'success' :
        type === 'loading' ? 'loading' :
        'info';

      const toastOptions =
        toastType === 'error'
          ? { persistent: true, dismissible: true, duration: 0, title: 'Error' }
          : toastType === 'loading'
            ? { persistent: true, dismissible: false, duration: 0, title: 'Working' }
            : toastType === 'success'
              ? { persistent: false, dismissible: true, duration: 5000, title: 'Done' }
              : { persistent: false, dismissible: true, duration: 6000, title: 'Notice' };

      showToast(message, toastType, toastOptions);
    }

    function applyLastDrawText(value) {
      lastDraw.textContent = value || 'Not yet run today';
    }

    function getSelectedWinnerKeys() {
      return Array.from(document.querySelectorAll('.winner-check:checked'))
        .map((checkbox) => checkbox.value)
        .filter(Boolean);
    }

    function updateSelectionButtons() {
      redrawSelectedBtn.disabled = getSelectedWinnerKeys().length === 0;
    }

    function renderWinners(winners) {
      winnerList.innerHTML = '';

      if (!winners || !winners.length) {
        setHidden(winnersCard, true);
        updateSelectionButtons();
        return;
      }

      winners.forEach((winner, index) => {
        const row = document.createElement('label');
        row.className = 'winner-pill';

        row.innerHTML = `
          <input class="winner-check" type="checkbox" value="${escapeHtml(winner.key || '')}">
          <span class="winner-pill-text">
            <strong>${index + 1}.</strong> ${escapeHtml(winner.displayName || '')}
          </span>
          <span class="pill-check" aria-hidden="true">✓</span>
        `;

        const checkbox = row.querySelector('.winner-check');

        const syncSelectedState = () => {
          row.classList.toggle('selected', checkbox.checked);
          updateSelectionButtons();
        };

        checkbox.addEventListener('change', syncSelectedState);
        row.addEventListener('click', () => {
          requestAnimationFrame(syncSelectedState);
        });

        syncSelectedState();
        winnerList.appendChild(row);
      });

      setHidden(winnersCard, false);
      updateSelectionButtons();
    }

    function normalizeResponse(response) {
      if (!response || typeof response !== 'object') {
        return { ok: false, message: 'Invalid server response.' };
      }

      if ('ok' in response) return response;

      if ('success' in response) {
        return {
          ok: !!response.success,
          message: response.message || '',
          details: response.details || '',
          winners: response.winners || [],
          lastDrawText: response.lastDrawText || '',
          drawnToday: !!response.drawnToday
        };
      }

      return { ok: false, message: 'Unexpected response format.' };
    }

    function submitRaffleRequest(action, options = {}) {
      return new Promise((resolve, reject) => {
        if (pendingRequest) {
          reject(new Error('Another raffle request is already in progress.'));
          return;
        }

        pendingRequest = { resolve, reject };

        transportAction.value = action;
        transportAdminKey.value = getAdminKey();
        transportWinnerCount.value = options.winnerCount || '';

        selectedKeysContainer.innerHTML = '';
        (options.selectedWinnerKeys || []).forEach((key) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'selectedWinnerKeys';
          input.value = key;
          selectedKeysContainer.appendChild(input);
        });

        raffleTransportForm.submit();

        requestTimeout = window.setTimeout(() => {
          if (!pendingRequest) return;
          pendingRequest = null;
          reject(new Error('The raffle request timed out.'));
        }, 15000);
      });
    }

    async function unlockRaffle() {
      const inputValue = adminKeyInput.value.trim();

      if (!inputValue) {
        setStatus(authStatus, 'Enter the admin key.', 'error');
        return;
      }

      unlockBtn.disabled = true;
      setStatus(authStatus, 'Checking key...', 'loading');

      try {
        setAdminKey(inputValue);
        const response = await submitRaffleRequest('authCheck');

        if (!response.ok) {
          clearAdminKey();
          adminKeyInput.focus();
          adminKeyInput.select?.();
          setStatus(authStatus, response.message || 'Invalid admin key.', 'error');
          unlockBtn.disabled = false;
          return;
        }

        authCard.hidden = true;
        raffleApp.hidden = false;
        adminKeyInput.value = '';
        setStatus(authStatus, '');
        unlockBtn.disabled = false;

        await loadState();
      } catch (error) {
        clearAdminKey();
        setStatus(authStatus, error.message || 'Unlock failed.', 'error');
        unlockBtn.disabled = false;
      }
    }

    async function loadState() {
      setStatus(null, 'Loading raffle data', 'loading');

      try {
        const response = await submitRaffleRequest('getState');

        if (!response.ok) {
          renderWinners([]);
          redrawBlock.hidden = true;
          drawBtn.hidden = false;
          applyLastDrawText('');
          setStatus(null, response.message || 'Failed to load state.', 'error');
          return;
        }

        renderWinners(response.winners || []);
        redrawBlock.hidden = !response.drawnToday;
        drawBtn.hidden = !!response.drawnToday;
        applyLastDrawText(response.lastDrawText);
        setStatus(null, '');
      } catch (error) {
        setStatus(null, error.message || 'Failed to load state.', 'error');
      }
    }

    async function runDraw(isAdditional) {
      const winnerCount = parseInt(winnerCountInput.value, 10);

      if (!winnerCount || winnerCount < 1) {
        setStatus(null, 'Enter a valid number of winners.', 'error');
        return;
      }

      if (isAdditional && !allowRedraw.checked) {
        setStatus(
          null,
          'Check the confirmation box before running an additional draw.',
          'error'
        );
        return;
      }

      const action = isAdditional ? 'drawAdditional' : 'drawWinners';
      const button = isAdditional ? drawAdditionalBtn : drawBtn;

      button.disabled = true;
      setStatus(null, isAdditional ? 'Running additional draw...' : 'Drawing winners', 'loading');

      try {
        const response = await submitRaffleRequest(action, { winnerCount });

        if (!response.ok) {
          setStatus(
            null,
            (response.message || 'Request failed.') +
              (response.details ? `\n${response.details}` : ''),
            'error'
          );
          button.disabled = false;
          return;
        }

        applyLastDrawText(response.lastDrawText);

        if (Array.isArray(response.winners)) {
          renderWinners(response.winners);
          redrawBlock.hidden = false;
          drawBtn.hidden = true;
        }

        setStatus(
          null,
          (response.message || 'Success.') +
            (response.details ? `\n${response.details}` : ''),
          'success'
        );

        button.disabled = false;
        await loadState();
      } catch (error) {
        setStatus(null, error.message || 'Draw failed.', 'error');
        button.disabled = false;
      }
    }

    async function redrawSelected() {
      const selectedWinnerKeys = getSelectedWinnerKeys();

      if (!selectedWinnerKeys.length) {
        setStatus(null, 'Select at least one winner to redraw.', 'error');
        return;
      }

      redrawSelectedBtn.disabled = true;
      setStatus(null, 'Redrawing selected winner(s)...', 'loading');

      try {
        const response = await submitRaffleRequest('redrawSelected', { selectedWinnerKeys });

        if (!response.ok) {
          setStatus(
            null,
            (response.message || 'Redraw failed.') +
              (response.details ? `\n${response.details}` : ''),
            'error'
          );
          await loadState();
          return;
        }

        setStatus(
          null,
          (response.message || 'Selective redraw complete.') +
            (response.details ? `\n${response.details}` : ''),
          'success'
        );

        await loadState();
      } catch (error) {
        setStatus(null, error.message || 'Redraw failed.', 'error');
      } finally {
        redrawSelectedBtn.disabled = false;
      }
    }

    function forgetKey() {
      clearAdminKey();
      authCard.hidden = false;
      raffleApp.hidden = true;
      adminKeyInput.value = '';
      adminKeyInput.focus();
      setStatus(authStatus, 'Logged Out', 'info');
      winnerList.innerHTML = '';
      winnersCard.hidden = true;
      redrawBlock.hidden = true;
      drawBtn.hidden = false;
      unlockBtn.disabled = false;
    }

    window.addEventListener('message', (event) => {
      const origin = event.origin || '';
      const allowed =
        origin === 'https://script.google.com' ||
        origin.endsWith('.googleusercontent.com');

      if (!allowed || !pendingRequest) return;

      if (requestTimeout) {
        clearTimeout(requestTimeout);
        requestTimeout = null;
      }

      const payload = normalizeResponse(event.data);
      const { resolve } = pendingRequest;
      pendingRequest = null;
      resolve(payload);
    });

    authCard.addEventListener('submit', (event) => {
      event.preventDefault();
      unlockRaffle();
    });

    drawBtn.addEventListener('click', () => runDraw(false));
    drawAdditionalBtn.addEventListener('click', () => runDraw(true));
    redrawSelectedBtn.addEventListener('click', redrawSelected);

    allowRedraw.addEventListener('change', () => {
      drawAdditionalBtn.disabled = !allowRedraw.checked;
    });

    forgetKeyBtn.addEventListener('click', forgetKey);

    adminKeyInput.addEventListener('input', () => {
      const value = adminKeyInput.value.replace(/\D/g, '');
      adminKeyInput.value = value;

      if (value.length === 4) {
        unlockRaffle();
      }
    });

    (async () => {
      drawAdditionalBtn.disabled = !allowRedraw.checked;

      if (!getAdminKey()) {
        authCard.hidden = false;
        raffleApp.hidden = true;
        adminKeyInput.focus();
        return;
      }

      try {
        const response = await submitRaffleRequest('authCheck');

        if (!response.ok) {
          clearAdminKey();
          authCard.hidden = false;
          raffleApp.hidden = true;
          adminKeyInput.focus();
          setStatus(authStatus, response.message || 'Admin key is no longer valid.', 'error');
          return;
        }

        authCard.hidden = true;
        raffleApp.hidden = false;
        await loadState();
      } catch (error) {
        clearAdminKey();
        authCard.hidden = false;
        raffleApp.hidden = true;
        setStatus(authStatus, error.message || 'Unable to restore admin session.', 'error');
      }
    })();
  });
})();
