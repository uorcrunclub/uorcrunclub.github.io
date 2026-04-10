(() => {
  'use strict';

  const { qs, isScrolledToBottom } = window.UORC || {};

  function splitFullName(fullName) {
    const cleaned = fullName.trim().replace(/\s+/g, ' ');

    if (!cleaned) {
      return { firstName: '', lastName: '' };
    }

    const parts = cleaned.split(' ');

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts.slice(-1).join('')
    };
  }

  function generateFlowToken() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return `uorc-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const waiverBox = qs('#waiverBox');
    const waiverShell = qs('#waiverShell');
    const agreeCheckbox = qs('#agreeCheckbox');
    const signatureSection = qs('#signatureSection');
    const fullLegalName = qs('#fullLegalName');
    const continueBtn = qs('#continueBtn');
    const messageBox = qs('#messageBox');

    let waiverScrolledToBottom = false;

    function showMessage(text, type) {
      messageBox.textContent = text;
      messageBox.className = `message ${type}`;
    }

    function clearMessage() {
      messageBox.textContent = '';
      messageBox.className = 'message';
    }

    function updateWaiverScrollState() {
      if (!waiverScrolledToBottom && isScrolledToBottom(waiverBox)) {
        waiverScrolledToBottom = true;
        waiverShell.classList.add('read-complete');
      }
    }

    function updateUIState() {
      updateWaiverScrollState();

      if (agreeCheckbox.checked) {
        signatureSection.classList.add('show');
      } else {
        signatureSection.classList.remove('show');
      }

      continueBtn.disabled = !(waiverScrolledToBottom && agreeCheckbox.checked);
    }

    waiverBox.addEventListener('scroll', () => {
      clearMessage();
      updateUIState();
    });

    agreeCheckbox.addEventListener('change', () => {
      clearMessage();
      updateUIState();

      if (agreeCheckbox.checked) {
        window.setTimeout(() => fullLegalName.focus(), 50);
      } else {
        fullLegalName.value = '';
      }
    });

    fullLegalName.addEventListener('input', clearMessage);

    continueBtn.addEventListener('click', () => {
      clearMessage();
      updateUIState();

      if (!waiverScrolledToBottom) {
        showMessage('Please scroll through the waiver before continuing.', 'error');
        return;
      }

      if (!agreeCheckbox.checked) {
        showMessage('Please check the agreement box before continuing.', 'error');
        return;
      }

      if (!fullLegalName.value.trim()) {
        showMessage(
          'Please type your full legal name to provide your electronic signature.',
          'error'
        );
        fullLegalName.focus();
        return;
      }

      const signatureName = fullLegalName.value.trim();
      const splitName = splitFullName(signatureName);

      sessionStorage.removeItem('uorcWaiverData');

      const waiverData = {
        waiverAccepted: 'Yes',
        signature: signatureName,
        signedAt: new Date().toISOString(),
        waiverFlowToken: generateFlowToken(),
        firstName: splitName.firstName,
        lastName: splitName.lastName
      };

      sessionStorage.setItem('uorcWaiverData', JSON.stringify(waiverData));

      showMessage('Waiver accepted. Redirecting to sign-in...', 'success');

      window.setTimeout(() => {
        window.location.href = 'signin.html';
      }, 700);
    });

    updateUIState();
  });
})();
