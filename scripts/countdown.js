/* ═══════════════════════════════════════════════════════════════
   VCtv TM — countdown.js
   Contagem regressiva discreta no canto inferior direito.  Para
   essa nova versão, a pill aparece apenas se houver um launch-at
   no window.VCTV_DATA.META.  Quando já passou, a pill pulsa.
   No site atual (pré-lançamento), serve pra guiar o usuário ao
   novo site — na versão TM deixamos um modo "relançamento" que
   só anuncia a versão.
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;
  const LAUNCH_KEY = 'vctv-tm-launch';
  /* Segunda-feira às 20:00 (horário Brasil UTC-3) da próxima semana */
  const DEFAULT_LAUNCH = new Date();
  DEFAULT_LAUNCH.setDate(DEFAULT_LAUNCH.getDate() + ((1 - DEFAULT_LAUNCH.getDay() + 7) % 7 || 7));
  DEFAULT_LAUNCH.setHours(20, 0, 0, 0);

  function parseLaunch() {
    const saved = U.storage.get(LAUNCH_KEY);
    if (saved) return new Date(saved);
    return DEFAULT_LAUNCH;
  }

  function diff(future, now) {
    let ms = future.getTime() - now.getTime();
    if (ms < 0) return null;
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    ms -= d * 1000 * 60 * 60 * 24;
    const h = Math.floor(ms / (1000 * 60 * 60));
    ms -= h * 1000 * 60 * 60;
    const m = Math.floor(ms / (1000 * 60));
    ms -= m * 1000 * 60;
    const s = Math.floor(ms / 1000);
    return { d, h, m, s };
  }

  function formatParts(p) {
    if (p.d > 0) return `${p.d}d ${p.h}h ${p.m}min`;
    if (p.h > 0) return `${p.h}h ${p.m}min`;
    return `${p.m}min ${p.s}s`;
  }

  function mount() {
    if (U.qs('#countdown-pill')) return;
    /* Só monta se NÃO estamos no próprio site novo; na VCtv TM
       mostramos uma pill de "nova era" celebrativa que some ao clicar */
    const pill = U.create('button', {
      id: 'countdown-pill',
      class: 'glass-pill glass-pill-strong glass-floating',
      'aria-label': 'VCtv TM — nova era',
      style: {
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 300,
        fontSize: '0.78rem',
        padding: '8px 14px',
        display: 'none',
      },
    });
    pill.innerHTML =
      '<span style="display:flex;flex-direction:column;align-items:flex-start;line-height:1.2;">' +
        '<strong style="font-family:var(--font-display);letter-spacing:-.02em;">⚡ VCtv TM</strong>' +
        '<span id="countdown-text" style="font-size:0.72rem;color:var(--text-muted);font-weight:500;">Nova era em breve</span>' +
      '</span>';
    document.body.appendChild(pill);
    pill.addEventListener('click', () => pill.style.display = 'none');
    pill.addEventListener('mouseenter', () => {
      const t = U.qs('#countdown-text');
      if (t) t.textContent = 'Uma nova era começou. 💜💚';
    });
    return pill;
  }

  function update() {
    const pill = U.qs('#countdown-pill');
    const text = U.qs('#countdown-text');
    if (!pill || !text) return;
    const now = new Date();
    const launch = parseLaunch();
    const parts = diff(launch, now);

    if (!parts) {
      pill.classList.add('anim-glow-mix');
      text.textContent = 'Mesma essência. Nova era.';
      return;
    }
    text.textContent = 'Chega em: ' + formatParts(parts);
  }

  function init() {
    /* A pill fica escondida por padrão nesta versão.  Para ativar:
       window.VCTV_DATA.META.showCountdown = true */
    if (!window.VCTV_DATA || !window.VCTV_DATA.META || !window.VCTV_DATA.META.showCountdown) return;
    mount();
    const pill = U.qs('#countdown-pill');
    if (pill) pill.style.display = 'inline-flex';
    update();
    setInterval(update, 1000);
  }

  window.VCTV_COUNTDOWN = { init, mount, update, parseLaunch };
})();
