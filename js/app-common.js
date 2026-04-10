(() => {
  'use strict';

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function setHidden(element, hidden) {
    if (!element) return;
    element.hidden = !!hidden;
    element.classList.toggle('hidden', !!hidden);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatPhoneInput(value) {
    const digits = digitsOnly(value).slice(0, 10);

    if (digits.length === 0) return '';
    if (digits.length < 4) return `(${digits}`;
    if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function attachPhoneFormatter(input) {
    if (!input) return;

    input.addEventListener('input', (event) => {
      event.target.value = formatPhoneInput(event.target.value);
    });

    input.addEventListener('blur', (event) => {
      event.target.value = formatPhoneInput(event.target.value);
    });
  }

  function isScrolledToBottom(element, threshold = 8) {
    if (!element) return false;
    return element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/webapp/service-worker.js')
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    });
  }

  function installPageShowCacheBuster() {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    });
  }

  let activeToast = null;
  let activeToastTimer = null;

  function removeToast(immediate = false) {
    if (!activeToast) return;

    const toast = activeToast;
    activeToast = null;

    const backdrop = qs('#toastBackdrop');
    const host = qs('#toastHost');

    if (backdrop) {
      backdrop.classList.remove('show', 'loading-backdrop', 'error-backdrop');
    }

    if (host) {
      host.classList.remove('top', 'center', 'is-loading', 'is-error');
    }

    if (activeToastTimer) {
      clearTimeout(activeToastTimer);
      activeToastTimer = null;
    }

    if (immediate) {
      toast.remove();
      return;
    }

    toast.classList.remove('show');
    toast.classList.add('hide');

    window.setTimeout(() => {
      toast.remove();
    }, 220);
  }

  function enableToastSwipe(toast) {
    let startX = 0;
    let currentX = 0;
    let dragging = false;

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse') return;
      dragging = true;
      startX = event.clientX;
      currentX = 0;
      toast.style.transition = 'none';
      toast.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!dragging) return;
      currentX = event.clientX - startX;
      toast.style.transform = `translateX(${currentX}px) scale(1)`;
      toast.style.opacity = String(Math.max(0.35, 1 - Math.abs(currentX) / 220));
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;

      const shouldDismiss = Math.abs(currentX) > 90;
      toast.style.transition = '';

      if (shouldDismiss) {
        removeToast();
      } else {
        toast.style.transform = '';
        toast.style.opacity = '';
      }
    };

    toast.addEventListener('pointerdown', onPointerDown);
    toast.addEventListener('pointermove', onPointerMove);
    toast.addEventListener('pointerup', onPointerUp);
    toast.addEventListener('pointercancel', onPointerUp);
  }

  function showToast(message, type = 'info', options = {}) {
    const {
      title = '',
      duration = 7000,
      dismissible = true,
      persistent = false
    } = options;

    const host = qs('#toastHost');
    const backdrop = qs('#toastBackdrop');
    if (!host) return;

    removeToast(true);

    const useCenteredOverlay = type === 'error' || type === 'loading';

    host.classList.remove('top', 'center', 'is-loading', 'is-error');
    host.classList.add(useCenteredOverlay ? 'center' : 'top');

    if (type === 'loading') {
      host.classList.add('is-loading');
    } else if (type === 'error') {
      host.classList.add('is-error');
    }

    if (backdrop) {
      backdrop.classList.remove('show', 'loading-backdrop', 'error-backdrop');

      if (useCenteredOverlay) {
        backdrop.classList.add('show');
        backdrop.classList.add(type === 'loading' ? 'loading-backdrop' : 'error-backdrop');
      }
    }

    const toast = document.createElement('div');
    toast.className = `toast-card ${type}`;

    const resolvedTitle =
      title ||
      (type === 'error'
        ? 'Error'
        : type === 'success'
          ? 'Done'
          : type === 'loading'
            ? 'Working'
            : 'Notice');

    toast.innerHTML = `
      ${resolvedTitle ? `<span class="toast-title">${escapeHtml(resolvedTitle)}</span>` : ''}
      <div class="toast-message">${escapeHtml(message || '')}</div>
      ${dismissible ? '<button class="toast-close" type="button">Dismiss</button>' : ''}
    `;

    if (dismissible) {
      toast.querySelector('.toast-close')?.addEventListener('click', () => removeToast());
      enableToastSwipe(toast);
    }

    host.appendChild(toast);
    activeToast = toast;

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    if (!persistent && duration > 0) {
      activeToastTimer = window.setTimeout(() => removeToast(), duration);
    }
  }

  function setToastStatus(message, type = 'info', options = {}) {
    if (!message) {
      removeToast();
      return;
    }
    showToast(message, type, options);
  }

  window.UORC = {
    qs,
    qsa,
    setHidden,
    escapeHtml,
    isIos,
    isAndroid,
    isStandalone,
    digitsOnly,
    formatPhoneInput,
    attachPhoneFormatter,
    isScrolledToBottom,
    showToast,
    removeToast,
    setToastStatus
  };

  installPageShowCacheBuster();
  registerServiceWorker();
})();
