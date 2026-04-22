/* ═══════════════════════════════════════════════════════════════
   VCtv TM — glass.js
   Efeitos dinâmicos nos cards Liquid Glass: luz reativa ao mouse
   (variáveis CSS --mx / --my), parallax sutil em elementos com
   [data-parallax], e um "glow trail" no cursor para desktop.
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;
  const REACTIVE_SELECTOR = '.glass-card, .glass-card-strong, .glass-pill-strong, .glass-panel';
  const MAX_TILT = 4; /* graus */

  function handlePointerMove(e) {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    target.style.setProperty('--mx', x + '%');
    target.style.setProperty('--my', y + '%');

    if (target.dataset.tilt === 'true') {
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (e.clientX - rect.left - cx) / cx;
      const dy = (e.clientY - rect.top - cy) / cy;
      target.style.transform =
        `perspective(900px) rotateX(${(-dy * MAX_TILT).toFixed(2)}deg) rotateY(${(dx * MAX_TILT).toFixed(2)}deg) translateZ(0)`;
    }
  }

  function handlePointerLeave(e) {
    const t = e.currentTarget;
    t.style.setProperty('--mx', '50%');
    t.style.setProperty('--my', '50%');
    if (t.dataset.tilt === 'true') {
      t.style.transform = '';
    }
  }

  function injectLayers(el) {
    /* Só pra cards grandes — pills/circles não precisam dessas camadas */
    if (!el.matches('.glass-card, .glass-card-strong, .glass-panel')) return;
    if (el.querySelector(':scope > .lg-layers')) return;

    const layers = document.createElement('span');
    layers.className = 'lg-layers';
    layers.setAttribute('aria-hidden', 'true');

    const sweep = document.createElement('span');
    sweep.className = 'lg-sweep';
    sweep.setAttribute('aria-hidden', 'true');

    const grain = document.createElement('span');
    grain.className = 'lg-grain';
    grain.setAttribute('aria-hidden', 'true');

    /* prepend pra não atrapalhar ::before/::after nem ordenar acima do conteúdo */
    el.insertBefore(grain, el.firstChild);
    el.insertBefore(sweep, el.firstChild);
    el.insertBefore(layers, el.firstChild);
  }

  function bind(el) {
    if (el.__glassBound) return;
    el.__glassBound = true;
    el.classList.add('is-reactive');
    injectLayers(el);
    el.addEventListener('pointermove', U.rafSchedule(handlePointerMove));
    el.addEventListener('pointerleave', handlePointerLeave);
  }

  function scan(root) {
    U.qsa(REACTIVE_SELECTOR, root || document).forEach(bind);
  }

  /* Observador de DOM: novos cards adicionados dinamicamente
     (ex.: grid de edições renderizada) ganham o efeito automaticamente. */
  function observeMutations() {
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches(REACTIVE_SELECTOR)) bind(node);
          if (node.querySelectorAll) {
            node.querySelectorAll(REACTIVE_SELECTOR).forEach(bind);
          }
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return mo;
  }

  /* ─── PARALLAX em [data-parallax="0.15"] ──────────────── */
  function bindParallax() {
    const items = U.qsa('[data-parallax]');
    if (!items.length) return;
    const apply = U.rafSchedule(() => {
      const y = window.scrollY || window.pageYOffset;
      items.forEach((el) => {
        const factor = parseFloat(el.dataset.parallax) || 0.1;
        el.style.transform = `translate3d(0, ${(-y * factor).toFixed(1)}px, 0)`;
      });
    });
    window.addEventListener('scroll', apply, { passive: true });
    apply();
  }

  /* ─── CURSOR GLOW (desktop only, prefers-motion) ──────── */
  function mountCursorGlow() {
    if (U.device.isMobile() || U.device.prefersReducedMotion()) return;
    const dot = U.create('div', {
      id: 'cursor-glow',
      'aria-hidden': 'true',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 1,
        background: 'radial-gradient(circle, rgba(160,80,240,0.18) 0%, rgba(0,230,110,0.08) 40%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        mixBlendMode: 'screen',
        transition: 'opacity 0.3s ease',
        opacity: '0',
        willChange: 'transform, opacity',
      },
    });
    document.body.appendChild(dot);

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    const loop = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (dot.style.opacity !== '1') dot.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      dot.style.opacity = '0';
    });
  }

  /* ─── RIPPLE em tudo com .has-ripple ──────────────────── */
  function bindRipples() {
    U.qsa('.has-ripple, .btn-primary, .btn-ghost, .btn-cta').forEach((el) => {
      if (!el.__rippleBound) {
        el.__rippleBound = true;
        U.attachRipple(el);
      }
    });
  }

  function init() {
    scan();
    observeMutations();
    bindParallax();
    mountCursorGlow();
    bindRipples();
  }

  window.VCTV_GLASS = { init, scan, bind };
})();
