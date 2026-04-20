/* ═══════════════════════════════════════════════════════════════
   VCtv TM — theme.js
   Toggle claro/escuro.  Padrão: escuro.  Valor salvo em
   localStorage `vctv-theme`.  Transição suave via clip-path
   usando coords do botão clicado.
   =========================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'vctv-theme';
  const U = window.VCTV_UTILS;

  function getPreferred() {
    const saved = U.storage.get(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; /* padrão: escuro (combina com Liquid Glass) */
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'light' ? '#f5f4f8' : '#050309');
    }
    U.storage.set(STORAGE_KEY, theme);
    U.emit('vctv:theme-changed', { theme });
  }

  function toggle(e) {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';

    /* Animação suave via clip-path */
    const btn = e && e.currentTarget ? e.currentTarget : null;
    if (btn && !U.device.prefersReducedMotion() && document.startViewTransition) {
      try {
        const rect = btn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        document.documentElement.style.setProperty('--cx', x + 'px');
        document.documentElement.style.setProperty('--cy', y + 'px');
        document.startViewTransition(() => apply(next));
        return;
      } catch {}
    }
    apply(next);
  }

  function init() {
    apply(getPreferred());
    const btn = U.qs('#theme-toggle');
    if (btn) btn.addEventListener('click', toggle);

    /* Atalho: Shift + T */
    document.addEventListener('keydown', (e) => {
      if (e.shiftKey && (e.key === 'T' || e.key === 't') && !e.metaKey && !e.ctrlKey) {
        if (document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
        toggle();
      }
    });

    /* Reage a mudanças do sistema SE não há preferência salva */
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener && mq.addEventListener('change', (ev) => {
      if (!U.storage.has(STORAGE_KEY)) {
        apply(ev.matches ? 'light' : 'dark');
      }
    });
  }

  window.VCTV_THEME = { init, apply, toggle, get: getPreferred };
})();
