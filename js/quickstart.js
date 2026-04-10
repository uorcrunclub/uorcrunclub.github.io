(() => {
  'use strict';

  const { qsa, qs, setHidden, isIos, isAndroid, isStandalone } = window.UORC || {};

  const STORAGE_KEY = 'uorc-setup-platform';
  const appUrlMeta = document.querySelector('meta[name="uorc-app-url"]');
  const APP_URL = appUrlMeta?.content?.trim() || 'https://uorcrunclub.github.io/webapp/waiver.html';
  
  const buttons = qsa('.setup-platform-btn');
  const cards = qsa('.setup-platform-card');

  const androidInstallBtn = qs('#androidInstallBtn');
  const androidOpenLink = qs('#androidOpenLink');
  const androidPromptHelper = qs('#androidPromptHelper');
  const iosLaunchLink = qs('#iosLaunchLink');

  const iosInstalledCard = qs('#iosInstalledCard');
  const androidInstalledCard = qs('#androidInstalledCard');
  const iosLaunchCard = qs('#iosLaunchCard');
  const androidInstallPromptCard = qs('#androidInstallPromptCard');
  const iosSteps = qs('#iosSteps');
  const androidSteps = qs('#androidSteps');
  const iosBrowserOnlyNote = qs('#iosBrowserOnlyNote');

  let deferredPrompt = null;

  function detectPlatform() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ios' || saved === 'android') return saved;
    } catch (error) {
      console.warn('Unable to read saved platform:', error);
    }

    if (isIos()) return 'ios';
    if (isAndroid()) return 'android';
    return 'ios';
  }

  function showPlatform(platform, shouldScroll = true) {
    buttons.forEach((button) => {
      const isActive = button.dataset.target === platform;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    cards.forEach((card) => {
      const isMatch = card.dataset.platform === platform;
      setHidden(card, !isMatch);
    });

    try {
      localStorage.setItem(STORAGE_KEY, platform);
    } catch (error) {
      console.warn('Unable to save selected platform:', error);
    }

    if (shouldScroll) {
      const activeCard = qs(`.setup-platform-card[data-platform="${platform}"]`);
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function updateInstalledUi() {
    const standalone = isStandalone();

    setHidden(iosLaunchCard, standalone);
    setHidden(iosSteps, standalone);
    setHidden(iosBrowserOnlyNote, standalone);
    setHidden(iosInstalledCard, !standalone);

    setHidden(androidInstallPromptCard, standalone);
    setHidden(androidSteps, standalone);
    setHidden(androidInstalledCard, !standalone);
  }

  function updateLaunchUi() {
    if (!androidInstallBtn || !androidOpenLink || !androidPromptHelper) return;

    if (deferredPrompt) {
      setHidden(androidInstallBtn, false);
      setHidden(androidOpenLink, true);
      androidPromptHelper.textContent = 'Tap Install App to open Android’s install prompt.';
    } else {
      setHidden(androidInstallBtn, true);
      setHidden(androidOpenLink, false);
      androidPromptHelper.textContent =
        'If your browser supports app install, the Install App button will appear automatically.';
    }

    if (androidOpenLink) {
      androidOpenLink.href = APP_URL;
    }
    
    if (iosLaunchLink) {
      iosLaunchLink.href = APP_URL;
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      showPlatform(button.dataset.target, true);
    });
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    updateLaunchUI();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    updateLaunchUI();
    updateInstalledUi();
  });

  if (androidInstallBtn) {
    androidInstallBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();

      try {
        await deferredPrompt.userChoice;
      } catch (error) {
        console.warn('Install prompt did not complete cleanly:', error);
      }

      deferredPrompt = null;
      updateLaunchUI();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    showPlatform(detectPlatform(), false);
    updateInstalledUi();
    updateLaunchUI();
  });
})();
