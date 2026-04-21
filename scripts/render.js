/* ═══════════════════════════════════════════════════════════════
   VCtv TM — render.js
   Renderização dos cards de edição, grids, filtros, seção de
   equipe, comentários (via WhatsApp redirect) e do "Hero".
   Fica em window.VCTV_RENDER.
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;

  /* Resolve URL do PDF: usa campo .pdf se existir, senão .arquivo */
  function getPdfUrl(ed) {
    return ed.pdf || ed.arquivo || '';
  }

  /* Campo de descrição canônico */
  function getSummary(ed) {
    return ed.descricao || ed.resumo || '';
  }

  /* Tags / temas */
  function getTags(ed) {
    return ed.tags || ed.temas || [];
  }

  /* ─── CARD DE EDIÇÃO ─────────────────────────────────── */
  function renderEditionCard(ed) {
    const tipo = ed.tipo || 'semana';
    const card = U.create('article', {
      class: 'edition-card glass-card',
      'data-id': ed.id,
      'data-type': tipo,
      tabindex: '0',
    });

    /* Top bar com categoria e tipo */
    const top = U.create('div', { class: 'edition-card__top' });
    top.appendChild(U.create('span', { class: 'edition-card__icon' }, ed.icone || '📰'));
    top.appendChild(U.create('span', { class: 'edition-card__category' }, ed.categoria || ''));
    const typeBadge = U.create('span', {
      class: 'edition-card__type edition-card__type--' + tipo,
    }, tipo === 'mini' ? 'Mini' : tipo === 'especial' ? 'Especial' : 'Semana');
    top.appendChild(typeBadge);
    card.appendChild(top);

    /* Título */
    const title = U.create('h3', {
      class: 'edition-card__title',
      style: { fontFamily: 'var(--font-display)' },
    }, ed.titulo);
    card.appendChild(title);

    /* Resumo */
    const summary = getSummary(ed);
    if (summary) {
      card.appendChild(U.create('p', { class: 'edition-card__summary' },
        summary.length > 200 ? summary.slice(0, 197) + '…' : summary));
    }

    /* Tags */
    const tags = getTags(ed);
    if (tags && tags.length) {
      const tagList = U.create('div', { class: 'edition-card__tags' });
      tags.slice(0, 4).forEach((t) => {
        tagList.appendChild(U.create('span', { class: 'edition-card__tag glass-pill' }, '#' + t));
      });
      card.appendChild(tagList);
    }

    /* Footer: data + CTA */
    const footer = U.create('div', { class: 'edition-card__footer' });
    if (ed.dataExibicao || ed.data) {
      footer.appendChild(U.create('span', { class: 'edition-card__date' },
        ed.dataExibicao || U.formatDate(ed.data)));
    }
    const cta = U.create('button', {
      class: 'edition-card__cta btn-primary has-ripple',
      type: 'button',
      'data-open-pdf': ed.id,
      'aria-label': 'Abrir ' + ed.titulo,
    }, 'Ler →');
    footer.appendChild(cta);
    card.appendChild(footer);

    /* Barra de cor no topo (corTema) */
    if (ed.corTema) {
      card.style.setProperty('--accent', ed.corTema);
      card.classList.add('has-accent');
    }

    /* Click no card inteiro abre o PDF */
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-pdf]')) return;
      if (window.VCTV_PDF && window.VCTV_PDF.open) window.VCTV_PDF.open(ed);
    });
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === card) {
        e.preventDefault();
        if (window.VCTV_PDF && window.VCTV_PDF.open) window.VCTV_PDF.open(ed);
      }
    });

    return card;
  }

  /* ─── FEATURED EDITION ───────────────────────────────── */
  function renderFeatured() {
    const host = U.qs('#featured-edition');
    if (!host) return;
    const ed = window.VCTV_DATA.helpers.getFeatured();
    if (!ed) { host.remove(); return; }

    host.innerHTML = '';
    host.classList.add('glass-card-strong');

    const left = U.create('div', { class: 'featured__left' });
    left.appendChild(U.create('div', { class: 'featured__badge glass-pill' }, '✨ Destaque da semana'));
    left.appendChild(U.create('h2', {
      class: 'featured__title',
      style: { fontFamily: 'var(--font-display)' },
    }, ed.titulo));
    const summary = getSummary(ed);
    if (summary) left.appendChild(U.create('p', { class: 'featured__summary' }, summary));

    const meta = U.create('div', { class: 'featured__meta' });
    if (ed.dataExibicao || ed.data) {
      meta.appendChild(U.create('span', { class: 'featured__date' },
        '📅 ' + (ed.dataExibicao || U.formatDate(ed.data))));
    }
    if (ed.paginas) {
      meta.appendChild(U.create('span', { class: 'featured__pages' }, '📄 ' + ed.paginas + ' páginas'));
    }
    left.appendChild(meta);

    const actions = U.create('div', { class: 'featured__actions' });
    const readBtn = U.create('button', {
      class: 'btn-cta has-ripple',
      type: 'button',
      'data-open-pdf': ed.id,
    }, 'Ler agora →');
    const shareBtn = U.create('button', {
      class: 'btn-ghost has-ripple',
      type: 'button',
    }, 'Compartilhar 🔗');
    shareBtn.addEventListener('click', () => U.share({
      title: ed.titulo,
      text: getSummary(ed).slice(0, 140),
      url: location.origin + location.pathname + '#/edicao/' + ed.id,
    }));
    actions.appendChild(readBtn);
    actions.appendChild(shareBtn);
    left.appendChild(actions);

    host.appendChild(left);

    /* Right side: capa preview */
    const right = U.create('div', { class: 'featured__right' });
    const frame = U.create('div', { class: 'featured__cover glass-card-subtle' });
    const canvas = U.create('canvas', { class: 'featured__canvas', 'aria-hidden': 'true' });
    frame.appendChild(canvas);
    const fallback = U.create('div', { class: 'featured__fallback' });
    fallback.innerHTML = '<span style="font-size:6rem;">' + (ed.icone || '📰') + '</span>';
    frame.appendChild(fallback);
    right.appendChild(frame);
    host.appendChild(right);

    /* Tenta renderizar capa */
    const pdfUrl = getPdfUrl(ed);
    if (pdfUrl && window.VCTV_GALLERY) {
      window.VCTV_GALLERY.renderCover(canvas, pdfUrl, { scale: 1.4 })
        .then(() => { canvas.classList.add('is-loaded'); })
        .catch(() => { fallback.classList.add('is-visible'); });
    } else {
      fallback.classList.add('is-visible');
    }
  }

  /* ─── GRID COMPLETO + FILTROS ───────────────────────── */
  const filterState = { tipo: 'todos', categoria: 'todas', sort: 'recente', query: '' };

  function applyFilters(list) {
    let arr = [...list];
    if (filterState.tipo !== 'todos') arr = arr.filter((e) => e.tipo === filterState.tipo);
    if (filterState.categoria !== 'todas') arr = arr.filter((e) => e.categoria === filterState.categoria);
    if (filterState.query) {
      const q = filterState.query.toLowerCase();
      arr = arr.filter((e) =>
        e.titulo.toLowerCase().includes(q) ||
        getSummary(e).toLowerCase().includes(q) ||
        getTags(e).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filterState.sort === 'recente') {
      arr.sort((a, b) => new Date(b.data) - new Date(a.data));
    } else if (filterState.sort === 'antigo') {
      arr.sort((a, b) => new Date(a.data) - new Date(b.data));
    } else if (filterState.sort === 'titulo') {
      arr.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
    }
    return arr;
  }

  function renderEditionsGrid() {
    const host = U.qs('#editions-grid');
    if (!host) return;
    const list = applyFilters(window.VCTV_DATA.EDICOES || []);
    host.innerHTML = '';
    if (!list.length) {
      host.appendChild(U.create('div', { class: 'empty-state glass-card-subtle' },
        'Nenhuma edição com esses filtros. Tenta mudar aí 💜'));
      return;
    }
    list.forEach((ed, i) => {
      const card = renderEditionCard(ed);
      card.style.setProperty('--reveal-delay', (i * 40) + 'ms');
      card.classList.add('reveal-up');
      host.appendChild(card);
    });

    const obs = U.createRevealObserver();
    U.qsa('.reveal-up', host).forEach((el) => obs.observe(el));
  }

  function renderFilters() {
    const tipoWrap = U.qs('#filter-tipo');
    const categoriaWrap = U.qs('#filter-categoria');
    const sortSel = U.qs('#filter-sort');

    const tipos = [
      { key: 'todos', label: 'Tudo' },
      { key: 'semana', label: 'Semana' },
      { key: 'mini', label: 'Mini' },
      { key: 'especial', label: 'Especial' },
    ];

    if (tipoWrap) {
      tipoWrap.innerHTML = '';
      tipos.forEach((t) => {
        const chip = U.create('button', {
          class: 'filter-chip glass-pill' + (t.key === filterState.tipo ? ' is-active' : ''),
          type: 'button',
          'data-tipo': t.key,
        }, t.label);
        chip.addEventListener('click', () => {
          filterState.tipo = t.key;
          U.qsa('.filter-chip', tipoWrap).forEach((c) =>
            c.classList.toggle('is-active', c.dataset.tipo === t.key));
          renderEditionsGrid();
        });
        tipoWrap.appendChild(chip);
      });
    }

    if (categoriaWrap) {
      const cats = Array.from(new Set((window.VCTV_DATA.EDICOES || [])
        .map((e) => e.categoria).filter(Boolean))).sort();
      categoriaWrap.innerHTML = '';
      [{ key: 'todas', label: 'Todas' }, ...cats.map((c) => ({ key: c, label: c }))].forEach((c) => {
        const chip = U.create('button', {
          class: 'filter-chip glass-pill' + (c.key === filterState.categoria ? ' is-active' : ''),
          type: 'button',
          'data-categoria': c.key,
        }, c.label);
        chip.addEventListener('click', () => {
          filterState.categoria = c.key;
          U.qsa('.filter-chip', categoriaWrap).forEach((ch) =>
            ch.classList.toggle('is-active', ch.dataset.categoria === c.key));
          renderEditionsGrid();
        });
        categoriaWrap.appendChild(chip);
      });
    }

    if (sortSel) {
      sortSel.addEventListener('change', () => {
        filterState.sort = sortSel.value;
        renderEditionsGrid();
      });
    }
  }

  /* ─── EQUIPE ─────────────────────────────────────────── */
  function renderTeam() {
    const host = U.qs('#team-grid');
    if (!host) return;
    const eq = window.VCTV_DATA.EQUIPE || [];
    host.innerHTML = '';
    eq.forEach((p, i) => {
      const card = U.create('article', {
        class: 'team-card glass-card',
        'data-id': p.id,
      });
      card.style.setProperty('--reveal-delay', (i * 80) + 'ms');
      card.classList.add('reveal-up');
      card.appendChild(U.create('div', { class: 'team-card__avatar glass-circle glass-circle-lg' }, p.emoji || '🧑'));
      card.appendChild(U.create('h3', {
        class: 'team-card__name',
        style: { fontFamily: 'var(--font-display)' },
      }, p.nome));
      card.appendChild(U.create('div', { class: 'team-card__role gradient-text' }, p.papel));
      card.appendChild(U.create('p', { class: 'team-card__bio' }, p.bio));
      host.appendChild(card);
    });
    const obs = U.createRevealObserver();
    U.qsa('.reveal-up', host).forEach((el) => obs.observe(el));
  }

  /* ─── HERO STATS ─────────────────────────────────────── */
  function renderHeroStats() {
    const totalEl = U.qs('#stat-editions');
    if (totalEl) U.animateCounter(totalEl, (window.VCTV_DATA.EDICOES || []).length);
    const miniEl = U.qs('#stat-mini');
    if (miniEl) U.animateCounter(miniEl, window.VCTV_DATA.helpers.getByType('mini').length);
    const especialEl = U.qs('#stat-especial');
    if (especialEl) U.animateCounter(especialEl, window.VCTV_DATA.helpers.getByType('especial').length);
  }

  /* ─── FOOTER / ABOUT / NAV ───────────────────────────── */
  function updateYear() {
    const y = U.qs('#footer-year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function init() {
    renderHeroStats();
    renderFeatured();
    renderFilters();
    renderEditionsGrid();
    renderTeam();
    updateYear();
  }

  window.VCTV_RENDER = {
    init,
    renderEditionCard,
    renderFeatured,
    renderEditionsGrid,
    renderTeam,
    renderHeroStats,
    filterState,
  };
})();
