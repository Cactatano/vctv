/* ═══════════════════════════════════════════════════════════════
   VCtv TM — intro.js
   Sequência cinematográfica de apresentação.  Só roda na primeira
   visita (flag em localStorage).  Cenas de 3s cada, botão "Pular",
   botão "Continuar" visível quando pronto para encerrar.
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;
  const FLAG = 'intro-seen-vctv-tm-v1';
  const SCENE_DURATION = 3000;

  const SCENES = [
    {
      id: 'boot',
      title: 'VCtv TM',
      subtitle: 'Uma nova era começa.',
      body: 'Mesma essência. Design renovado. 💜💚',
    },
    {
      id: 'mission',
      title: 'O jornal feito por você…',
      subtitle: 'pra VC.',
      body: 'Criado em 2023, com carinho, com curiosidade, com vontade.',
    },
    {
      id: 'search',
      title: 'Busca inteligente',
      subtitle: 'VCai achou pra você.',
      body: 'Pergunte qualquer coisa. A IA filtra as edições.',
    },
    {
      id: 'favorites',
      title: 'Favoritos',
      subtitle: 'Seu arquivão pessoal.',
      body: 'Toque no coração. Elas ficam guardadas só pra VC.',
    },
    {
      id: 'gallery',
      title: 'Galeria de capas',
      subtitle: 'Reviva cada edição.',
      body: 'Navegue pelas capas como num museu virtual.',
    },
    {
      id: 'theme',
      title: 'Claro ou escuro',
      subtitle: 'Do seu jeito.',
      body: 'Liquid Glass nos dois mundos.',
    },
    {
      id: 'pdf',
      title: 'Leitura embutida',
      subtitle: 'Sem sair do site.',
      body: 'Abra, leia, compartilhe. Rapidão.',
    },
    {
      id: 'vcai',
      title: 'VCai 2.0',
      subtitle: 'O mascote conversou.',
      body: 'Pergunte sobre qualquer edição. Ele sabe.',
    },
    {
      id: 'final',
      title: 'VCtv TM',
      subtitle: 'Vamos juntos?',
      body: '💜💚 Por Caetano, Jaron e Érico.',
    },
  ];

  let current = 0;
  let timerId = null;
  let rootEl = null;

  function buildScene(scene, index) {
    const el = U.create('div', {
      class: `intro-scene intro-scene--${scene.id}`,
      'data-scene': scene.id,
      'data-index': index,
      'aria-hidden': 'true',
    });

    const inner = U.create('div', { class: 'intro-scene__inner' });

    inner.appendChild(U.create('div', {
      class: 'intro-scene__index',
    }, `${String(index + 1).padStart(2, '0')} / ${String(SCENES.length).padStart(2, '0')}`));

    inner.appendChild(U.create('h2', {
      class: 'intro-scene__title',
      style: { fontFamily: 'var(--font-display)' },
    }, scene.title));

    inner.appendChild(U.create('div', {
      class: 'intro-scene__subtitle gradient-text',
    }, scene.subtitle));

    inner.appendChild(U.create('p', {
      class: 'intro-scene__body',
    }, scene.body));

    /* Arte decorativa por cena (CSS controla a animação) */
    inner.appendChild(U.create('div', {
      class: 'intro-scene__art',
      'aria-hidden': 'true',
      'data-art': scene.id,
    }));

    el.appendChild(inner);
    return el;
  }

  function buildProgressDots() {
    const wrap = U.create('div', { class: 'intro-progress', 'aria-hidden': 'true' });
    SCENES.forEach((_, i) => {
      wrap.appendChild(U.create('span', { class: 'intro-progress__dot', 'data-dot': i }));
    });
    return wrap;
  }

  function setActive(idx) {
    if (!rootEl) return;
    const scenes = U.qsa('.intro-scene', rootEl);
    scenes.forEach((s, i) => {
      s.classList.toggle('is-active', i === idx);
      s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
    });
    U.qsa('.intro-progress__dot', rootEl).forEach((d, i) => {
      d.classList.toggle('is-active', i === idx);
      d.classList.toggle('is-past', i < idx);
    });

    /* Última cena: mostra o botão "Entrar" */
    const enterBtn = U.qs('#intro-enter', rootEl);
    if (enterBtn) {
      if (idx === SCENES.length - 1) enterBtn.classList.add('is-visible');
      else enterBtn.classList.remove('is-visible');
    }
  }

  function next() {
    if (current < SCENES.length - 1) {
      current += 1;
      setActive(current);
      scheduleNext();
    } else {
      /* Fica parado na última, aguardando clique */
      clearTimeout(timerId);
    }
  }

  function prev() {
    if (current > 0) {
      current -= 1;
      setActive(current);
      scheduleNext();
    }
  }

  function scheduleNext() {
    clearTimeout(timerId);
    if (current < SCENES.length - 1) {
      timerId = setTimeout(next, SCENE_DURATION);
    }
  }

  function finish() {
    clearTimeout(timerId);
    U.storage.set(FLAG, '1');
    if (!rootEl) return;
    rootEl.classList.add('is-leaving');
    setTimeout(() => {
      rootEl.remove();
      document.body.classList.remove('intro-active');
      U.emit('vctv:intro-finished', {});
    }, 700);
  }

  function skip() {
    finish();
  }

  function mount() {
    document.body.classList.add('intro-active');
    rootEl = U.create('div', {
      id: 'intro-root',
      class: 'intro-root',
      role: 'dialog',
      'aria-label': 'Apresentação VCtv TM',
    });

    /* Fundo com orbs animados */
    const bg = U.create('div', { class: 'intro-bg', 'aria-hidden': 'true' });
    bg.innerHTML =
      '<div class="intro-orb intro-orb--purple"></div>' +
      '<div class="intro-orb intro-orb--green"></div>' +
      '<div class="intro-noise"></div>';
    rootEl.appendChild(bg);

    /* Logo cantinho — usa mesmo componente mini do header */
    const logo = U.create('div', { class: 'intro-logo' });
    logo.innerHTML =
      '<span class="vctv-logo-mini" aria-hidden="true">' +
        '<span class="vctv-logo-mini__word" data-text="VCtv">VCtv</span>' +
        '<span class="vctv-logo-mini__tm" data-text="TM">TM</span>' +
      '</span>';
    rootEl.appendChild(logo);

    /* Botão pular (sempre visível) */
    const skipBtn = U.create('button', {
      id: 'intro-skip',
      class: 'intro-skip glass-pill',
      type: 'button',
      'aria-label': 'Pular apresentação',
    }, 'Pular tudo →');
    skipBtn.addEventListener('click', skip);
    rootEl.appendChild(skipBtn);

    /* Container de cenas */
    const stage = U.create('div', { class: 'intro-stage' });
    SCENES.forEach((s, i) => stage.appendChild(buildScene(s, i)));
    rootEl.appendChild(stage);

    /* Navegação por bolinhas */
    const dots = buildProgressDots();
    dots.addEventListener('click', (e) => {
      const dot = e.target.closest('.intro-progress__dot');
      if (!dot) return;
      current = parseInt(dot.dataset.dot, 10) || 0;
      setActive(current);
      scheduleNext();
    });
    rootEl.appendChild(dots);

    /* Controles (< >) */
    const controls = U.create('div', { class: 'intro-controls' });
    const prevBtn = U.create('button', {
      class: 'intro-ctrl intro-ctrl--prev glass-circle',
      'aria-label': 'Cena anterior',
      type: 'button',
    }, '‹');
    const nextBtn = U.create('button', {
      class: 'intro-ctrl intro-ctrl--next glass-circle',
      'aria-label': 'Próxima cena',
      type: 'button',
    }, '›');
    prevBtn.addEventListener('click', () => { prev(); });
    nextBtn.addEventListener('click', () => { next(); });
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    rootEl.appendChild(controls);

    /* Botão "Entrar" para encerrar (aparece na última cena) */
    const enterBtn = U.create('button', {
      id: 'intro-enter',
      class: 'intro-enter btn-cta',
      type: 'button',
    }, 'Entrar no site →');
    enterBtn.addEventListener('click', finish);
    rootEl.appendChild(enterBtn);

    document.body.appendChild(rootEl);
  }

  function bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!rootEl || !document.body.contains(rootEl)) return;
      if (e.key === 'Escape') { skip(); return; }
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Enter' && current === SCENES.length - 1) finish();
    });
  }

  function shouldRun() {
    if (U.storage.has(FLAG)) return false;
    if (U.device.prefersReducedMotion()) return false; /* respeita o usuário */
    const params = new URLSearchParams(location.search);
    if (params.get('skipIntro') === '1') return false;
    if (params.get('forceIntro') === '1') return true;
    return true;
  }

  function init(opts) {
    const force = opts && opts.force;
    if (!force && !shouldRun()) {
      U.emit('vctv:intro-skipped', {});
      return;
    }
    mount();
    bindKeyboard();
    setActive(0);
    scheduleNext();
  }

  function replay() {
    U.storage.remove(FLAG);
    init({ force: true });
  }

  window.VCTV_INTRO = { init, replay, finish, SCENES };
})();
