(() => {
  'use strict';

  const {
    escapeHtml,
    qs,
    digitsOnly,
    formatPhoneInput,
    attachPhoneFormatter
  } = window.UORC || {};

  const APP_CONFIG = {
    name: 'UORC Sign-In',
    version: 'v1.0.0'
  };

  let submissionInProgress = false;
  let submissionTimeout = null;

  function getWaiverData() {
    try {
      return JSON.parse(sessionStorage.getItem('uorcWaiverData'));
    } catch (error) {
      console.error('Failed to parse waiver data:', error);
      return null;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = qs('#form');
    const formContainer = qs('#formContainer');
    const successScreen = qs('#successScreen');
    const lockedScreen = qs('#lockedScreen');
    const waiverStatus = qs('#waiverStatus');
    const message = qs('#message');

    const firstNameInput = qs('#firstName');
    const lastNameInput = qs('#lastName');
    const emailInput = qs('#email');
    const phoneInput = qs('#phone');
    const emergencyNameInput = qs('#emergencyName');
    const emergencyPhoneInput = qs('#emergencyPhone');
    const submitBtn = qs('#submitBtn');

    const waiverAcceptanceInput = qs('#waiverAcceptance');
    const signatureInput = qs('#signature');
    const waiverSignedAtInput = qs('#waiverSignedAt');

    document.title = `${APP_CONFIG.name} | ${APP_CONFIG.version}`;

    const footerEl = qs('#footerVersion');
    if (footerEl) {
      footerEl.textContent = `${APP_CONFIG.name} | ${APP_CONFIG.version}`;
    }

    function showMessage(text, type) {
      message.textContent = text;
      message.className = `message ${type}`;
    }

    function clearMessage() {
      message.textContent = '';
      message.className = 'message';
    }

    function clearFieldErrors() {
      const fields = [
        firstNameInput,
        lastNameInput,
        emailInput,
        phoneInput,
        emergencyNameInput,
        emergencyPhoneInput
      ];

      fields.forEach((field) => {
        field.classList.remove('input-error');
        field.removeAttribute('aria-invalid');

        const errorEl = qs(`#${field.id}Error`);
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.remove('show');
        }
      });
    }

    function setFieldError(input, text) {
      input.classList.add('input-error');
      input.setAttribute('aria-invalid', 'true');

      const errorEl = qs(`#${input.id}Error`);
      if (errorEl) {
        errorEl.textContent = text;
        errorEl.classList.add('show');
      }

      showMessage(text, 'error');
      input.focus();
    }

    function clearSingleFieldError(input) {
      input.classList.remove('input-error');
      input.removeAttribute('aria-invalid');

      const errorEl = qs(`#${input.id}Error`);
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('show');
      }
    }

    function updateEmergencyPairHighlight() {
      const emergencyNameGroup = emergencyNameInput.closest('.field-group');
      const emergencyPhoneGroup = emergencyPhoneInput.closest('.field-group');

      const hasName = emergencyNameInput.value.trim().length > 0;
      const hasPhone = emergencyPhoneInput.value.trim().length > 0;
      const onlyOneFilled = (hasName || hasPhone) && !(hasName && hasPhone);

      [emergencyNameGroup, emergencyPhoneGroup].forEach((group) => {
        if (!group) return;
        group.classList.toggle('field-pair-pending', onlyOneFilled);
      });
    }

    function validateAccess() {
      const data = getWaiverData();

      if (!data || data.waiverAccepted !== 'Yes' || !data.signature || !data.waiverFlowToken) {
        formContainer.classList.add('hidden');
        lockedScreen.classList.add('show');
        return null;
      }

      waiverStatus.innerHTML = `Waiver signed by <strong>${escapeHtml(data.signature)}</strong>`;

      if (data.firstName) firstNameInput.value = data.firstName;
      if (data.lastName) lastNameInput.value = data.lastName;

      return data;
    }

    function validateForm() {
      clearMessage();
      clearFieldErrors();
      updateEmergencyPairHighlight();

      const firstName = firstNameInput.value.trim();
      const lastName = lastNameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();
      const emergencyName = emergencyNameInput.value.trim();
      const emergencyPhone = emergencyPhoneInput.value.trim();

      if (!firstName) {
        setFieldError(firstNameInput, 'Please enter your first name.');
        return false;
      }

      if (!lastName) {
        setFieldError(lastNameInput, 'Please enter your last name.');
        return false;
      }

      if (!email) {
        setFieldError(emailInput, 'Please enter your email address.');
        return false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError(emailInput, 'Please enter a valid email address.');
        return false;
      }

      if (phone) {
        const phoneDigits = digitsOnly(phone);
        if (phoneDigits.length !== 10) {
          setFieldError(phoneInput, 'Please enter a valid 10-digit phone number.');
          return false;
        }
        phoneInput.value = formatPhoneInput(phone);
      }

      if (emergencyName || emergencyPhone) {
        if (!emergencyName) {
          setFieldError(emergencyNameInput, 'Please enter an emergency contact name.');
          updateEmergencyPairHighlight();
          return false;
        }

        if (!emergencyPhone) {
          setFieldError(emergencyPhoneInput, 'Please enter an emergency contact phone number.');
          updateEmergencyPairHighlight();
          return false;
        }

        const emergencyPhoneDigits = digitsOnly(emergencyPhone);
        if (emergencyPhoneDigits.length !== 10) {
          setFieldError(
            emergencyPhoneInput,
            'Enter a valid 10-digit emergency phone number.'
          );
          updateEmergencyPairHighlight();
          return false;
        }

        emergencyPhoneInput.value = formatPhoneInput(emergencyPhone);
      }

      updateEmergencyPairHighlight();
      return true;
    }

    function resetSubmitState() {
      submissionInProgress = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Check In';

      if (submissionTimeout) {
        clearTimeout(submissionTimeout);
        submissionTimeout = null;
      }
    }

    qs('#goToWaiver').addEventListener('click', () => {
      window.location.href = 'waiver.html';
    });

    qs('#backBtn').addEventListener('click', () => {
      window.location.href = 'waiver.html';
    });

    qs('#nextBtn').addEventListener('click', () => {
      sessionStorage.removeItem('uorcWaiverData');
      form.reset();
      successScreen.classList.remove('show');
      window.location.href = 'waiver.html';
    });

    window.addEventListener('message', (event) => {
      const origin = event.origin || '';

      const isGoogleAppsScriptOrigin =
        origin === 'https://script.google.com' ||
        origin.endsWith('.googleusercontent.com') ||
        origin.includes('script.googleusercontent.com');

      if (!isGoogleAppsScriptOrigin) return;

      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.success === true) {
        resetSubmitState();
        formContainer.classList.add('hidden');

        const firstName = firstNameInput.value.trim();
        const successMessageEl = qs('#successMessage');
        const encouragementMessageEl = qs('#encouragementMessage');

        const successMessages = [
          firstName ? `${firstName}, you're checked in!` : `You're checked in!`,
          firstName ? `${firstName}, you're all set!` : `You're all set!`,
          firstName ? `Glad you're here, ${firstName}!` : `Glad you're here!`,
          firstName ? `Locked in, ${firstName}!` : `Locked In!`,
          firstName ? `Nice, ${firstName}. You're on the list!` : `You're on the list!`
        ];

        const encouragementMessages = [
          'See you on the course!',
          'Have a great run!',
          'Time to hit the pavement.',
          'Hope you crush it out there.',
          'Run strong and have fun.',
          'Let’s make it a good one.',
          'Enjoy the miles ahead.',
          'See you at the finish.'
        ];

        successMessageEl.textContent =
          successMessages[Math.floor(Math.random() * successMessages.length)];
        encouragementMessageEl.textContent =
          encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];

        successScreen.style.display = 'block';
        successScreen.classList.remove('show');
        void successScreen.offsetWidth;
        successScreen.classList.add('show');
        return;
      }

      if (data.success === false) {
        resetSubmitState();
        showMessage(data.message || 'Submission failed.', 'error');
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearMessage();

      const waiver = getWaiverData();

      if (!waiver) {
        showMessage('Waiver information is missing. Please complete the waiver again.', 'error');
        return;
      }

      if (!validateForm()) return;
      if (submissionInProgress) return;

      submissionInProgress = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      phoneInput.value = digitsOnly(phoneInput.value.trim());
      emergencyPhoneInput.value = digitsOnly(emergencyPhoneInput.value.trim());
      waiverAcceptanceInput.value = waiver.waiverAccepted;
      signatureInput.value = waiver.signature;
      waiverSignedAtInput.value = waiver.signedAt || '';

      submissionTimeout = window.setTimeout(() => {
        if (!submissionInProgress) return;
        resetSubmitState();
        showMessage('Submission timed out. Check the sheet, then try again.', 'error');
      }, 10000);

      form.submit();
    });

    attachPhoneFormatter(phoneInput);
    attachPhoneFormatter(emergencyPhoneInput);

    [
      firstNameInput,
      lastNameInput,
      emailInput,
      phoneInput,
      emergencyNameInput,
      emergencyPhoneInput
    ].forEach((input) => {
      input.addEventListener('input', () => {
        clearSingleFieldError(input);
        clearMessage();

        if (input === emergencyNameInput || input === emergencyPhoneInput) {
          updateEmergencyPairHighlight();
        }
      });

      input.addEventListener('blur', () => {
        if (input === emergencyNameInput || input === emergencyPhoneInput) {
          updateEmergencyPairHighlight();
        }
      });
    });

    updateEmergencyPairHighlight();
    validateAccess();
  });
})();
