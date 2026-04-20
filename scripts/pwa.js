/* ═══════════════════════════════════════════════════════════════
   VCtv TM — pwa.js
   Registro de service worker + tutorial iOS "Adicionar à tela
   inicial" (aparece uma vez, clicável pra reabrir depois).
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;
  const IOS_FLAG = 'vctv-ios-tutorial-seen';
  let deferredPrompt = null;

  /* ─── SERVICE WORKER ─────────────────────────────────── */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              U.toast({
                title: 'Nova versão disponível',
                text: 'Recarregue pra ver as novidades 💜',
                icon: '🔄',
                duration: 6000,
              });
            }
          });
        });
      }).catch(() => { /* silencioso */ });
    });
  }

  /* ─── Web Install Prompt (Android/desktop) ───────────── */
  function bindInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallBadge();
    });
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      hideInstallBadge();
      U.toast.success('Instalado!', 'VCtv TM agora é app. 💜💚');
    });
  }

  function showInstallBadge() {
    if (U.qs('#install-badge')) return;
    const b = U.create('button', {
      id: 'install-badge',
      class: 'glass-pill glass-pill-filled glass-floating',
      type: 'button',
      'aria-label': 'Instalar VCtv TM',
      style: {
        position: 'fixed',
        bottom: '90px',
        right: '24px',
        zIndex: 200,
        padding: '10px 16px',
        fontSize: '0.85rem',
      },
    }, '📲 Instalar VCtv TM');
    b.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') hideInstallBadge();
      deferredPrompt = null;
    });
    document.body.appendChild(b);
  }

  function hideInstallBadge() {
    const b = U.qs('#install-badge');
    if (b) b.remove();
  }

  /* ─── iOS TUTORIAL ───────────────────────────────────── */
  function shouldShowIosTutorial() {
    if (!U.device.isIOS()) return false;
    if (U.device.isStandalone()) return false;
    if (U.storage.get(IOS_FLAG)) return false;
    return true;
  }

  function buildIosTutorial() {
    const overlay = U.create('div', {
      id: 'pwa-tutorial',
      class: 'pwa-tutorial-overlay modal-overlay',
      role: 'dialog',
      'aria-label': 'Como instalar no iOS',
    });

    const card = U.create('div', { class: 'pwa-tutorial glass-card-strong' });

    card.appendChild(U.create('div', { class: 'pwa-tutorial__icon glass-circle glass-circle-lg' }, '📲'));
    card.appendChild(U.create('h2', {
      class: 'pwa-tutorial__title',
      style: { fontFamily: 'var(--font-display)' },
    }, 'Bota a VCtv na sua tela inicial'));
    card.appendChild(U.create('p', { class: 'pwa-tutorial__text' },
      'No iPhone ou iPad, o jornal fica igualzinho app. Assim:'));

    const steps = U.create('ol', { class: 'pwa-tutorial__steps' });
    const stepsData = [
      { icon: '🔽', text: 'Toque no ícone de compartilhar (seta pra cima, na barra inferior do Safari).' },
      { icon: '➕', text: 'Role e toque em "Adicionar à Tela de Início".' },
      { icon: '✅', text: 'Toque em "Adicionar". Pronto! Abra pelo ícone da VCtv TM.' },
    ];
    stepsData.forEach((s, i) => {
      const li = U.create('li', { class: 'pwa-tutorial__step' });
      li.innerHTML =
        '<span class="pwa-tutorial__step-num glass-circle">' + (i + 1) + '</span>' +
        '<span class="pwa-tutorial__step-icon">' + s.icon + '</span>' +
        '<span class="pwa-tutorial__step-text">' + U.escape(s.text) + '</span>';
      steps.appendChild(li);
    });
    card.appendChild(steps);

    const actions = U.create('div', { class: 'pwa-tutorial__actions' });
    const laterBtn = U.create('button', { class: 'btn-ghost', type: 'button' }, 'Agora não');
    const gotItBtn = U.create('button', { class: 'btn-primary has-ripple', type: 'button' }, 'Entendi 💜');
    laterBtn.addEventListener('click', closeIos);
    gotItBtn.addEventListener('click', () => {
      U.storage.set(IOS_FLAG, '1');
      closeIos();
    });
    actions.appendChild(laterBtn);
    actions.appendChild(gotItBtn);
    card.appendChild(actions);

    overlay.appendChild(card);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeIos(); });

    return overlay;
  }

  function openIos() {
    let overlay = U.qs('#pwa-tutorial');
    if (!overlay) {
      overlay = buildIosTutorial();
      document.body.appendChild(overlay);
    }
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    document.body.classList.add('has-modal');
  }

  function closeIos() {
    const overlay = U.qs('#pwa-tutorial');
    if (overlay) overlay.classList.remove('is-open');
    document.body.classList.remove('has-modal');
  }

  function maybeShowIosTutorial() {
    if (!shouldShowIosTutorial()) return;
    setTimeout(openIos, 3200); /* só depois da primeira interação / intro */
  }

  /* ─── PUBLIC ─────────────────────────────────────────── */
  function init() {
    registerSW();
    bindInstallPrompt();
    maybeShowIosTutorial();

    /* Listener em qualquer [data-action="show-install"] */
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action="show-install"]');
      if (!t) return;
      if (U.device.isIOS()) openIos();
      else if (deferredPrompt) deferredPrompt.prompt();
      else U.toast.info('Use o menu do navegador', 'Procure "Instalar app" ou "Adicionar à tela inicial".');
    });
  }

  window.VCTV_PWA = { init, openIos, closeIos };
})();
