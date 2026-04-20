/* ═══════════════════════════════════════════════════════════════
   VCtv TM — favorites.js
   Sistema de favoritos.  Cada edição tem um botão de coração.
   Favoritos salvos em localStorage como array de IDs.  Renderiza
   também a seção dedicada "Meus Favoritos".
   =========================================================== */

(function () {
  'use strict';

  const KEY = 'vctv-favorites';
  const U = window.VCTV_UTILS;

  function getAll() {
    const v = U.storage.get(KEY, []);
    return Array.isArray(v) ? v : [];
  }

  function isFav(id) {
    return getAll().includes(id);
  }

  function toggle(id) {
    const list = getAll();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    else list.push(id);
    U.storage.set(KEY, list);
    U.emit('vctv:favorites-changed', { id, isFav: i < 0, list });
    return i < 0;
  }

  function add(id) {
    if (!isFav(id)) toggle(id);
  }

  function remove(id) {
    if (isFav(id)) toggle(id);
  }

  function updateBtnState(btn, favorited) {
    btn.classList.toggle('is-favorited', favorited);
    btn.setAttribute('aria-pressed', favorited ? 'true' : 'false');
    btn.setAttribute('aria-label', favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
  }

  function emitSparkles(btn) {
    if (U.device.prefersReducedMotion()) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const emojis = ['💜', '💚', '✨', '⭐', '💫'];

    for (let i = 0; i < 6; i++) {
      const sparkle = U.create('div', {
        style: {
          position: 'fixed',
          left: cx + 'px',
          top: cy + 'px',
          zIndex: 9999,
          fontSize: '14px',
          pointerEvents: 'none',
          opacity: '1',
          transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
        },
      }, emojis[i % emojis.length]);
      document.body.appendChild(sparkle);
      const angle = (Math.random() * Math.PI * 2);
      const dist = 40 + Math.random() * 40;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 30;
      requestAnimationFrame(() => {
        sparkle.style.transform = `translate(${dx}px, ${dy}px) scale(0.4)`;
        sparkle.style.opacity = '0';
      });
      setTimeout(() => sparkle.remove(), 900);
    }
  }

  function handleClick(e) {
    const btn = e.target.closest('.fav-btn');
    if (!btn) return;
    e.stopPropagation();
    e.preventDefault();
    const id = btn.dataset.id;
    if (!id) return;
    const nowFav = toggle(id);
    updateBtnState(btn, nowFav);

    if (nowFav) {
      emitSparkles(btn);
      const ed = window.VCTV_DATA.helpers.getById(id);
      U.toast.success('Adicionado aos favoritos', ed ? ed.titulo : '');
    } else {
      U.toast.info('Removido dos favoritos', '');
    }

    /* Re-renderiza a seção de favoritos se estiver visível */
    renderFavoritesSection();
  }

  function buildHeartSVG() {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 21s-7.5-4.7-7.5-11A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 7.5 4c0 6.3-7.5 11-7.5 11z"/>' +
      '</svg>'
    );
  }

  /* Injeta o gradient definitions (uma vez só) */
  function injectGradient() {
    if (document.getElementById('vctv-svg-defs')) return;
    const svg = U.create('svg', {
      id: 'vctv-svg-defs',
      'aria-hidden': 'true',
      width: '0', height: '0',
      style: { position: 'absolute', width: 0, height: 0 },
    });
    svg.innerHTML =
      '<defs>' +
        '<linearGradient id="grad-heart" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#a050f0"/>' +
          '<stop offset="100%" stop-color="#00e66e"/>' +
        '</linearGradient>' +
        '<linearGradient id="grad-main" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#a050f0"/>' +
          '<stop offset="100%" stop-color="#00e66e"/>' +
        '</linearGradient>' +
      '</defs>';
    document.body.appendChild(svg);
  }

  /* Cria o botão de favorito para um card */
  function createFavButton(id) {
    const btn = U.create('button', {
      class: 'fav-btn',
      'data-id': id,
      'aria-label': 'Adicionar aos favoritos',
      type: 'button',
    });
    btn.innerHTML = buildHeartSVG();
    updateBtnState(btn, isFav(id));
    return btn;
  }

  /* ─── RENDER DA SEÇÃO "MEUS FAVORITOS" ──────────────── */
  function renderFavoritesSection() {
    const host = U.qs('#favorites-list');
    if (!host) return;
    const list = getAll();
    const editions = list.map((id) => window.VCTV_DATA.helpers.getById(id)).filter(Boolean);

    host.innerHTML = '';

    if (editions.length === 0) {
      const empty = U.create('div', { class: 'fav-empty glass-card-subtle' });
      empty.appendChild(U.create('div', { class: 'fav-empty__icon glass-circle glass-circle-lg' }, '💜'));
      empty.appendChild(U.create('div', { class: 'fav-empty__title' }, 'Nenhum favorito ainda'));
      empty.appendChild(U.create('div', { class: 'fav-empty__text' },
        'Toque no coração nos cards de edição e eles aparecem aqui. Seu arquivão pessoal da VCtv. 💚'));
      host.appendChild(empty);
      return;
    }

    const grid = U.create('div', { class: 'editions-grid' });
    editions.forEach((ed) => {
      if (window.VCTV_RENDER && window.VCTV_RENDER.renderEditionCard) {
        grid.appendChild(window.VCTV_RENDER.renderEditionCard(ed));
      }
    });
    host.appendChild(grid);
  }

  function init() {
    injectGradient();
    document.addEventListener('click', handleClick);
    document.addEventListener('vctv:favorites-changed', renderFavoritesSection);
    /* Delay para garantir que render.js já populou a grid */
    requestAnimationFrame(renderFavoritesSection);
  }

  window.VCTV_FAV = {
    init,
    isFav,
    toggle,
    add,
    remove,
    getAll,
    createFavButton,
    renderSection: renderFavoritesSection,
  };
})();
