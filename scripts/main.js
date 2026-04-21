/* ═══════════════════════════════════════════════════════════════
   VCtv TM — main.js
   Ponto de entrada.  Orquestra a ordem de inicialização dos
   módulos e configura o comportamento geral do header, scroll-top,
   banner do WhatsApp, modal de comentários e navegação suave.
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;

  /* ─── HEADER SCROLL STATE ────────────────────────────── */
  function bindHeaderScroll() {
    const header = U.qs('#site-header');
    if (!header) return;
    const onScroll = U.rafSchedule(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─── SCROLL-TOP BUTTON ──────────────────────────────── */
  function bindScrollTop() {
    const btn = U.qs('#scroll-top');
    if (!btn) return;
    const onScroll = U.rafSchedule(() => {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: U.device.prefersReducedMotion() ? 'auto' : 'smooth' });
    });
  }

  /* ─── SMOOTH NAVIGATION ─────────────────────────────── */
  function bindSmoothNav() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      if (href.startsWith('#/')) return; /* rotas */
      const target = U.qs(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: U.device.prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
      /* Fecha menu mobile se aberto */
      const menu = U.qs('#mobile-nav');
      if (menu) menu.classList.remove('is-open');
    });
  }

  /* ─── MOBILE NAV ─────────────────────────────────────── */
  function bindMobileNav() {
    const toggle = U.qs('#mobile-nav-toggle');
    const menu = U.qs('#mobile-nav');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-open', open);
    });
  }

  /* ─── WA BANNER DISMISS ──────────────────────────────── */
  function bindWaBanner() {
    const banner = U.qs('#wa-banner');
    if (!banner) return;
    if (U.storage.get('vctv-wa-dismissed')) { banner.remove(); return; }
    const close = U.qs('.wa-banner__close', banner);
    if (close) {
      close.addEventListener('click', () => {
        banner.classList.add('is-closing');
        setTimeout(() => {
          banner.remove();
          U.storage.set('vctv-wa-dismissed', '1');
        }, 300);
      });
    }
  }

  /* ─── COMMENTS (redireciona pro WhatsApp) ───────────── */
  function bindCommentForm() {
    const form = U.qs('#comment-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = U.qs('#comment-name', form);
      const msg = U.qs('#comment-msg', form);
      const nomeVal = nome && nome.value.trim();
      const msgVal = msg && msg.value.trim();
      if (!msgVal) {
        U.toast.error('Escreve algo aí', 'Precisa pelo menos do comentário 💜');
        return;
      }
      const channel = (window.VCTV_DATA && window.VCTV_DATA.META && window.VCTV_DATA.META.canal)
        || 'https://whatsapp.com/channel/0029VbCaofNGk1FuHSPhca17';
      const text = (nomeVal ? `[${nomeVal}] ` : '') + msgVal;
      const url = channel + '?text=' + encodeURIComponent(text);
      window.open(url, '_blank');
      U.toast.success('Valeu pela mensagem!', 'Te levamos pro nosso canal.');
      form.reset();
    });
  }

  /* ─── NOTIF BELL ─────────────────────────────────────── */
  function bindNotifBell() {
    const bell = U.qs('#notif-bell');
    if (!bell) return;
    bell.addEventListener('click', () => {
      U.toast({
        title: 'Notificações em breve!',
        text: 'Por enquanto, entra no canal do WhatsApp pra não perder nada 💚',
        icon: '🔔',
        duration: 4500,
      });
      const channel = (window.VCTV_DATA && window.VCTV_DATA.META && window.VCTV_DATA.META.canal);
      if (channel) setTimeout(() => window.open(channel, '_blank'), 900);
    });
  }

  /* ─── REPLAY INTRO BUTTON ────────────────────────────── */
  function bindReplayIntro() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="replay-intro"]')) {
        if (window.VCTV_INTRO) window.VCTV_INTRO.replay();
      }
    });
  }

  /* ─── REVEAL OBSERVER GLOBAL ─────────────────────────── */
  function bindReveals() {
    const obs = U.createRevealObserver();
    U.qsa('.reveal, .reveal-up, .reveal-left, .reveal-right').forEach((el) => obs.observe(el));
  }

  /* ─── BOOT SEQUENCE ──────────────────────────────────── */
  function boot() {
    /* Ordem importa: theme primeiro (evita flash branco),
       depois utils, favoritos (injeta gradient), intro, render,
       depois os módulos que dependem de dados renderizados. */
    if (window.VCTV_THEME) window.VCTV_THEME.init();

    /* Intro — só se for primeira visita */
    if (window.VCTV_INTRO) window.VCTV_INTRO.init();

    /* Render os dados */
    if (window.VCTV_RENDER) window.VCTV_RENDER.init();

    /* Galeria de capas */
    if (window.VCTV_GALLERY) window.VCTV_GALLERY.init();

    /* Leitor de PDF */
    if (window.VCTV_PDF) window.VCTV_PDF.init();

    /* Busca inteligente */
    if (window.VCTV_SEARCH) window.VCTV_SEARCH.init();

    /* VCai */
    if (window.VCTV_VCAI) window.VCTV_VCAI.init();

    /* Countdown (escondido por padrão) */
    if (window.VCTV_COUNTDOWN) window.VCTV_COUNTDOWN.init();

    /* Glass effects */
    if (window.VCTV_GLASS) window.VCTV_GLASS.init();

    /* PWA */
    if (window.VCTV_PWA) window.VCTV_PWA.init();

    /* Comportamento geral */
    bindHeaderScroll();
    bindScrollTop();
    bindSmoothNav();
    bindMobileNav();
    bindWaBanner();
    bindCommentForm();
    bindNotifBell();
    bindReplayIntro();
    bindReveals();

    /* Evento "boot finished" */
    U.emit('vctv:boot', {});
    document.documentElement.classList.add('vctv-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.VCTV_MAIN = { boot };
})();
