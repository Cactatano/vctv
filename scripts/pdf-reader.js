/* ═══════════════════════════════════════════════════════════════
   VCtv TM — pdf-reader.js
   Leitor de PDF premium em modal Liquid Glass.
   Features:
   • pdf.js com fallback pra abrir no navegador
   • Painel de thumbnails (abre/fecha)
   • Navegação por swipe no mobile
   • Slider de páginas
   • Zoom in/out, ajustar largura, ajustar tela
   • Tela cheia, compartilhar, baixar
   • Double-tap / double-click pra zoom rápido
   • Atalhos: ←/→ navega, +/- zoom, F tela cheia, T thumbs, W fit-width, Esc fecha
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;
  const PDFJS_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  const PROGRESS_KEY = 'vctv-pdf-progress';

  let pdfjsReady = null;
  let state = {
    doc: null,
    page: 1,
    total: 1,
    scale: 1.2,
    fit: 'custom',      // 'width' | 'page' | 'custom'
    edition: null,
    open: false,
    pdfUrl: null,
    rendering: false,
    nextPageQueued: null,
    thumbsOpen: false,
    thumbsRendered: false,
    darkMode: false,
    helpOpen: false,
  };

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
  function saveProgress(id, page) {
    try {
      const all = loadProgress();
      all[id] = { page, ts: Date.now() };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
    } catch {}
  }
  function getProgress(id) {
    const all = loadProgress();
    return all[id] ? all[id].page : null;
  }

  function loadPdfJs() {
    if (pdfjsReady) return pdfjsReady;
    pdfjsReady = new Promise((resolve, reject) => {
      if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
      const s = document.createElement('script');
      s.src = PDFJS_SRC;
      s.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
          resolve(window.pdfjsLib);
        } else reject(new Error('pdfjsLib not found'));
      };
      s.onerror = () => reject(new Error('failed to load pdf.js'));
      document.head.appendChild(s);
    });
    return pdfjsReady;
  }

  function buildModal() {
    const overlay = U.create('div', {
      id: 'pdf-reader-overlay',
      class: 'modal-overlay pdf-reader-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Leitor de PDF VCtv TM',
    });

    const modal = U.create('div', {
      class: 'pdf-reader glass-card-strong',
      role: 'document',
    });

    /* ── Header ── */
    const header = U.create('header', { class: 'pdf-reader__header' });

    const titleWrap = U.create('div', { class: 'pdf-reader__titlewrap' });
    titleWrap.appendChild(U.create('div', { class: 'pdf-reader__eyebrow eyebrow' }, 'VCtv TM · Leitura'));
    titleWrap.appendChild(U.create('div', { class: 'pdf-reader__title', id: 'pdf-title' }, ''));
    header.appendChild(titleWrap);

    const headerRight = U.create('div', { class: 'pdf-reader__actions' });
    const btnThumbs = U.create('button', {
      class: 'pdf-reader__btn glass-circle', id: 'pdf-btn-thumbs',
      'aria-label': 'Mostrar miniaturas', type: 'button', title: 'Miniaturas (T)',
    }, '▦');
    const btnFitWidth = U.create('button', {
      class: 'pdf-reader__btn glass-circle', id: 'pdf-btn-fitw',
      'aria-label': 'Ajustar à largura', type: 'button', title: 'Ajustar largura (W)',
    }, '↔');
    const btnDark = U.create('button', {
      class: 'pdf-reader__btn glass-circle', id: 'pdf-btn-dark',
      'aria-label': 'Alternar modo escuro do PDF', type: 'button', title: 'Modo escuro (D)',
    }, '◐');
    const btnHelp = U.create('button', {
      class: 'pdf-reader__btn glass-circle', id: 'pdf-btn-help',
      'aria-label': 'Mostrar atalhos', type: 'button', title: 'Atalhos (?)',
    }, '?');
    const btnShare = U.create('button', {
      class: 'pdf-reader__btn glass-circle',
      'aria-label': 'Compartilhar edição', type: 'button', title: 'Compartilhar',
    }, '🔗');
    const btnDownload = U.create('button', {
      class: 'pdf-reader__btn glass-circle',
      'aria-label': 'Baixar PDF', type: 'button', title: 'Baixar',
    }, '⬇');
    const btnFs = U.create('button', {
      class: 'pdf-reader__btn glass-circle',
      'aria-label': 'Tela cheia', type: 'button', title: 'Tela cheia (F)',
    }, '⛶');
    const btnClose = U.create('button', {
      class: 'pdf-reader__btn pdf-reader__btn--close glass-circle',
      'aria-label': 'Fechar leitor', type: 'button', title: 'Fechar (Esc)',
    }, '×');

    [btnThumbs, btnFitWidth, btnDark, btnHelp, btnShare, btnDownload, btnFs, btnClose].forEach((b) => headerRight.appendChild(b));
    header.appendChild(headerRight);
    modal.appendChild(header);

    /* ── Body: sidebar (thumbs) + viewport ── */
    const body = U.create('div', { class: 'pdf-reader__body' });

    const sidebar = U.create('aside', {
      class: 'pdf-reader__sidebar', id: 'pdf-sidebar',
      'aria-label': 'Miniaturas das páginas',
    });
    const thumbsList = U.create('div', { class: 'pdf-reader__thumbs', id: 'pdf-thumbs' });
    sidebar.appendChild(thumbsList);
    body.appendChild(sidebar);

    const viewport = U.create('div', { class: 'pdf-reader__viewport', id: 'pdf-viewport' });
    const canvasWrap = U.create('div', { class: 'pdf-reader__canvaswrap', id: 'pdf-canvaswrap' });
    const canvas = U.create('canvas', { class: 'pdf-reader__canvas', id: 'pdf-canvas' });
    canvasWrap.appendChild(canvas);
    viewport.appendChild(canvasWrap);

    /* Loading bonito com shimmer */
    const loading = U.create('div', { class: 'pdf-reader__loading', id: 'pdf-loading' });
    loading.innerHTML =
      '<div class="pdf-reader__loading-inner">' +
        '<div class="pdf-reader__loading-page">' +
          '<div class="pdf-reader__loading-shimmer"></div>' +
          '<div class="pdf-reader__loading-line" style="width:70%"></div>' +
          '<div class="pdf-reader__loading-line" style="width:90%"></div>' +
          '<div class="pdf-reader__loading-line" style="width:60%"></div>' +
          '<div class="pdf-reader__loading-line" style="width:85%"></div>' +
          '<div class="pdf-reader__loading-line" style="width:40%"></div>' +
        '</div>' +
        '<div class="pdf-reader__loading-label">Carregando edição…</div>' +
      '</div>';
    viewport.appendChild(loading);

    /* Help overlay (atalhos) */
    const help = U.create('div', { class: 'pdf-reader__help', id: 'pdf-help' });
    help.innerHTML =
      '<div class="pdf-reader__help-card glass-card">' +
        '<div class="eyebrow">Atalhos de teclado</div>' +
        '<h3 style="font-family:Fraunces,serif;margin:8px 0 14px;font-weight:700;">Navegação rápida</h3>' +
        '<div class="pdf-reader__help-grid">' +
          '<kbd>← →</kbd><span>Página anterior / próxima</span>' +
          '<kbd>PgUp PgDn</kbd><span>Idem</span>' +
          '<kbd>Home / End</kbd><span>Primeira / última página</span>' +
          '<kbd>+  −</kbd><span>Zoom in / out</span>' +
          '<kbd>W</kbd><span>Ajustar à largura</span>' +
          '<kbd>T</kbd><span>Miniaturas</span>' +
          '<kbd>D</kbd><span>Modo escuro do PDF</span>' +
          '<kbd>F</kbd><span>Tela cheia</span>' +
          '<kbd>?</kbd><span>Mostrar / esconder ajuda</span>' +
          '<kbd>Esc</kbd><span>Fechar leitor</span>' +
        '</div>' +
        '<button class="glass-pill" type="button" id="pdf-help-close" style="margin-top:14px;cursor:pointer;">Entendi</button>' +
      '</div>';
    viewport.appendChild(help);

    /* Botões flutuantes de navegação laterais */
    const floatPrev = U.create('button', {
      class: 'pdf-reader__float pdf-reader__float--prev glass-circle',
      'aria-label': 'Página anterior', type: 'button',
    }, '‹');
    const floatNext = U.create('button', {
      class: 'pdf-reader__float pdf-reader__float--next glass-circle',
      'aria-label': 'Próxima página', type: 'button',
    }, '›');
    viewport.appendChild(floatPrev);
    viewport.appendChild(floatNext);

    body.appendChild(viewport);
    modal.appendChild(body);

    /* ── Footer ── */
    const footer = U.create('footer', { class: 'pdf-reader__footer' });

    const pageCtrl = U.create('div', { class: 'pdf-reader__pagectrl' });
    const navPrev = U.create('button', {
      class: 'pdf-reader__nav glass-circle',
      'aria-label': 'Página anterior', type: 'button',
    }, '‹');
    const pageInfo = U.create('div', { class: 'pdf-reader__pageinfo', id: 'pdf-pageinfo' }, '1 / 1');
    const navNext = U.create('button', {
      class: 'pdf-reader__nav glass-circle',
      'aria-label': 'Próxima página', type: 'button',
    }, '›');
    pageCtrl.appendChild(navPrev);
    pageCtrl.appendChild(pageInfo);
    pageCtrl.appendChild(navNext);

    const slider = U.create('input', {
      class: 'pdf-reader__slider', id: 'pdf-slider',
      type: 'range', min: '1', max: '1', value: '1',
      'aria-label': 'Ir para página',
    });

    const zoomCtrl = U.create('div', { class: 'pdf-reader__zoomctrl' });
    const zoomOut = U.create('button', {
      class: 'pdf-reader__zoom glass-pill',
      'aria-label': 'Diminuir zoom', type: 'button',
    }, '−');
    const zoomLabel = U.create('div', { class: 'pdf-reader__zoomlabel', id: 'pdf-zoomlabel' }, '120%');
    const zoomIn = U.create('button', {
      class: 'pdf-reader__zoom glass-pill',
      'aria-label': 'Aumentar zoom', type: 'button',
    }, '+');
    zoomCtrl.appendChild(zoomOut);
    zoomCtrl.appendChild(zoomLabel);
    zoomCtrl.appendChild(zoomIn);

    footer.appendChild(pageCtrl);
    footer.appendChild(slider);
    footer.appendChild(zoomCtrl);

    modal.appendChild(footer);
    overlay.appendChild(modal);

    /* ── Handlers ── */
    btnClose.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    btnShare.addEventListener('click', shareCurrent);
    btnDownload.addEventListener('click', downloadCurrent);
    btnFs.addEventListener('click', toggleFullscreen);
    btnThumbs.addEventListener('click', toggleThumbs);
    btnFitWidth.addEventListener('click', fitToWidth);
    btnDark.addEventListener('click', toggleDark);
    btnHelp.addEventListener('click', toggleHelp);
    const helpCloseBtn = help.querySelector('#pdf-help-close');
    if (helpCloseBtn) helpCloseBtn.addEventListener('click', toggleHelp);
    help.addEventListener('click', (e) => { if (e.target === help) toggleHelp(); });
    navPrev.addEventListener('click', prevPage);
    navNext.addEventListener('click', nextPage);
    floatPrev.addEventListener('click', prevPage);
    floatNext.addEventListener('click', nextPage);
    zoomIn.addEventListener('click', () => setScale(state.scale + 0.2));
    zoomOut.addEventListener('click', () => setScale(state.scale - 0.2));
    slider.addEventListener('input', (e) => {
      const p = parseInt(e.target.value, 10);
      if (p && p !== state.page) { state.page = p; renderPage(); }
    });
    thumbsList.addEventListener('click', (e) => {
      const t = e.target.closest('.pdf-thumb');
      if (!t) return;
      const p = parseInt(t.dataset.page, 10);
      if (p) { state.page = p; renderPage(); }
    });

    /* Swipe no viewport */
    bindSwipe(viewport);
    /* Double-tap zoom */
    bindDoubleTap(canvasWrap);

    document.body.appendChild(overlay);
    return overlay;
  }

  function bindSwipe(el) {
    let startX = 0, startY = 0, startT = 0, tracking = false;
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = Date.now();
      tracking = true;
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startT;
      if (Math.abs(dx) > 60 && Math.abs(dy) < 50 && dt < 600) {
        if (dx < 0) nextPage();
        else prevPage();
      }
    }, { passive: true });
  }

  function bindDoubleTap(el) {
    let lastTap = 0;
    let zoomed = false;
    el.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < 400) {
        if (zoomed) { state.scale = 1.2; zoomed = false; }
        else { state.scale = 2.2; zoomed = true; }
        state.fit = 'custom';
        renderPage();
      }
      lastTap = now;
    });
  }

  async function loadDoc(url) {
    const pdfjsLib = await loadPdfJs();
    const task = pdfjsLib.getDocument({ url });
    state.doc = await task.promise;
    state.total = state.doc.numPages;
    state.page = 1;
    state.thumbsRendered = false;

    const slider = U.qs('#pdf-slider');
    if (slider) {
      slider.max = String(state.total);
      slider.value = '1';
    }
  }

  async function renderPage() {
    if (!state.doc) return;
    if (state.rendering) { state.nextPageQueued = state.page; return; }
    state.rendering = true;

    const canvas = U.qs('#pdf-canvas');
    const loading = U.qs('#pdf-loading');
    if (loading) loading.style.display = 'flex';

    try {
      const page = await state.doc.getPage(state.page);
      let scale = state.scale;

      if (state.fit === 'width') {
        const viewport = U.qs('#pdf-viewport');
        const basic = page.getViewport({ scale: 1 });
        const avail = (viewport ? viewport.clientWidth : 800) - 48;
        scale = avail / basic.width;
        state.scale = scale;
      }

      const viewport = page.getViewport({ scale });
      const ctx = canvas.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      await page.render({ canvasContext: ctx, viewport }).promise;

      if (loading) loading.style.display = 'none';

      const info = U.qs('#pdf-pageinfo');
      if (info) info.textContent = state.page + ' / ' + state.total;
      const zoomL = U.qs('#pdf-zoomlabel');
      if (zoomL) zoomL.textContent = Math.round(state.scale * 100) + '%';
      const slider = U.qs('#pdf-slider');
      if (slider && Number(slider.value) !== state.page) slider.value = String(state.page);

      /* Persiste progresso */
      if (state.edition && state.edition.id) {
        saveProgress(state.edition.id, state.page);
      }

      const thumbs = U.qsa('.pdf-thumb', U.qs('#pdf-thumbs'));
      thumbs.forEach((t) => t.classList.toggle('is-active', Number(t.dataset.page) === state.page));
      const active = thumbs.find((t) => Number(t.dataset.page) === state.page);
      if (active && state.thumbsOpen) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (err) {
      if (loading) loading.style.display = 'none';
    }

    state.rendering = false;
    if (state.nextPageQueued && state.nextPageQueued !== state.page) {
      state.page = state.nextPageQueued;
      state.nextPageQueued = null;
      renderPage();
    }
  }

  async function renderThumbnails() {
    if (!state.doc || state.thumbsRendered) return;
    state.thumbsRendered = true;
    const list = U.qs('#pdf-thumbs');
    if (!list) return;
    list.innerHTML = '';

    for (let p = 1; p <= state.total; p += 1) {
      const item = U.create('button', {
        class: 'pdf-thumb' + (p === state.page ? ' is-active' : ''),
        'data-page': String(p),
        type: 'button',
        'aria-label': 'Ir para página ' + p,
      });
      const c = document.createElement('canvas');
      c.className = 'pdf-thumb__canvas';
      const label = U.create('span', { class: 'pdf-thumb__label' }, String(p));
      item.appendChild(c);
      item.appendChild(label);
      list.appendChild(item);

      /* Renderiza assíncrono pra não travar */
      (async (num, canvasEl) => {
        try {
          const page = await state.doc.getPage(num);
          const vp = page.getViewport({ scale: 0.25 });
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvasEl.width = Math.floor(vp.width * dpr);
          canvasEl.height = Math.floor(vp.height * dpr);
          canvasEl.style.width = Math.floor(vp.width) + 'px';
          canvasEl.style.height = Math.floor(vp.height) + 'px';
          const ctx = canvasEl.getContext('2d');
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
        } catch {}
      })(p, c);
    }
  }

  function toggleThumbs() {
    state.thumbsOpen = !state.thumbsOpen;
    const overlay = U.qs('#pdf-reader-overlay');
    if (overlay) overlay.classList.toggle('has-thumbs', state.thumbsOpen);
    if (state.thumbsOpen) renderThumbnails();
  }

  function fitToWidth() {
    state.fit = state.fit === 'width' ? 'custom' : 'width';
    if (state.fit === 'custom') state.scale = 1.2;
    renderPage();
  }

  function toggleDark() {
    state.darkMode = !state.darkMode;
    const overlay = U.qs('#pdf-reader-overlay');
    if (overlay) overlay.classList.toggle('is-dark-pdf', state.darkMode);
    U.toast && U.toast.info && U.toast.info(state.darkMode ? 'Modo escuro ativado' : 'Modo escuro desativado');
  }

  function toggleHelp() {
    state.helpOpen = !state.helpOpen;
    const overlay = U.qs('#pdf-reader-overlay');
    if (overlay) overlay.classList.toggle('is-help-open', state.helpOpen);
  }

  function setScale(s) {
    state.fit = 'custom';
    state.scale = U.clamp(s, 0.5, 3);
    renderPage();
  }

  function nextPage() {
    if (state.page < state.total) { state.page += 1; renderPage(); }
  }
  function prevPage() {
    if (state.page > 1) { state.page -= 1; renderPage(); }
  }

  function shareCurrent() {
    if (!state.edition) return;
    U.share({
      title: state.edition.titulo,
      text: 'Confere essa edição da VCtv TM 💜💚',
      url: location.origin + location.pathname + '#/edicao/' + state.edition.id,
    });
  }

  function downloadCurrent() {
    if (!state.edition) return;
    const url = state.pdfUrl || state.edition.pdf || state.edition.arquivo;
    if (!url) return;
    U.download(url, (state.edition.titulo || 'vctv') + '.pdf');
    U.toast.success('Download iniciado', state.edition.titulo);
  }

  function toggleFullscreen() {
    const el = U.qs('#pdf-reader-overlay');
    if (!el) return;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  function keydown(e) {
    if (!state.open) return;
    /* Se o help tá aberto, só Esc e ? fecham */
    if (state.helpOpen) {
      if (e.key === 'Escape' || e.key === '?') toggleHelp();
      return;
    }
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' || e.key === 'PageDown') nextPage();
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevPage();
    if (e.key === 'Home') { state.page = 1; renderPage(); }
    if (e.key === 'End') { state.page = state.total; renderPage(); }
    if (e.key === '+' || e.key === '=') setScale(state.scale + 0.2);
    if (e.key === '-' || e.key === '_') setScale(state.scale - 0.2);
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if (e.key === 't' || e.key === 'T') toggleThumbs();
    if (e.key === 'w' || e.key === 'W') fitToWidth();
    if (e.key === 'd' || e.key === 'D') toggleDark();
    if (e.key === '?') toggleHelp();
  }

  async function open(edition) {
    if (!edition) return;
    const pdfUrl = edition.pdf || edition.arquivo;
    if (!pdfUrl) return;
    state.edition = edition;
    state.pdfUrl = pdfUrl;
    state.open = true;
    state.page = 1;
    state.scale = 1.2;
    state.fit = 'custom';
    state.thumbsRendered = false;

    let overlay = U.qs('#pdf-reader-overlay');
    if (!overlay) overlay = buildModal();
    overlay.classList.add('is-open');
    overlay.classList.remove('has-thumbs');
    state.thumbsOpen = false;
    document.body.classList.add('has-modal');

    const title = U.qs('#pdf-title');
    if (title) title.textContent = edition.titulo;

    const loading = U.qs('#pdf-loading');
    if (loading) {
      loading.style.display = 'flex';
      loading.innerHTML =
        '<div class="pdf-reader__loading-inner">' +
          '<div class="pdf-reader__loading-page">' +
            '<div class="pdf-reader__loading-shimmer"></div>' +
            '<div class="pdf-reader__loading-line" style="width:70%"></div>' +
            '<div class="pdf-reader__loading-line" style="width:90%"></div>' +
            '<div class="pdf-reader__loading-line" style="width:60%"></div>' +
            '<div class="pdf-reader__loading-line" style="width:85%"></div>' +
            '<div class="pdf-reader__loading-line" style="width:40%"></div>' +
          '</div>' +
          '<div class="pdf-reader__loading-label">Carregando ' + U.escape(edition.titulo || 'edição') + '…</div>' +
        '</div>';
    }

    try {
      await loadDoc(pdfUrl);

      /* Resume progresso se tiver */
      const saved = getProgress(edition.id);
      if (saved && saved > 1 && saved <= state.total) {
        state.page = saved;
        if (U.toast && U.toast.info) {
          U.toast.info('Continuando da página ' + saved);
        }
      }

      await renderPage();
    } catch (err) {
      if (loading) {
        loading.innerHTML =
          '<div class="glass-card-subtle" style="padding:28px;text-align:center;max-width:440px;">' +
            '<div style="font-size:3rem;">📄</div>' +
            '<h3 style="margin:12px 0 6px;font-family:Fraunces,serif;">Não deu pra abrir por aqui</h3>' +
            '<p style="color:var(--text-muted);margin:0 0 16px;">Clique abaixo pra abrir direto no navegador.</p>' +
            '<a class="btn-primary has-ripple" href="' + U.escape(pdfUrl) + '" target="_blank" rel="noopener">Abrir PDF →</a>' +
          '</div>';
      }
    }

    location.hash = '#/edicao/' + edition.id;
    U.emit('vctv:edition-opened', { id: edition.id });
  }

  function close() {
    const overlay = U.qs('#pdf-reader-overlay');
    if (overlay) overlay.classList.remove('is-open', 'has-thumbs');
    document.body.classList.remove('has-modal');
    state.open = false;
    state.thumbsOpen = false;
    if (document.fullscreenElement && document.exitFullscreen) {
      try { document.exitFullscreen(); } catch {}
    }
    if (location.hash.startsWith('#/edicao/')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    if (state.doc) {
      try { state.doc.cleanup(); state.doc.destroy(); } catch {}
      state.doc = null;
    }
  }

  function handleInitialHash() {
    const m = (location.hash || '').match(/^#\/edicao\/(.+)$/);
    if (!m) return;
    const ed = window.VCTV_DATA.helpers.getById(m[1]);
    if (ed) open(ed);
  }

  function init() {
    document.addEventListener('keydown', keydown);
    window.addEventListener('hashchange', handleInitialHash);
    document.addEventListener('click', (e) => {
      const trg = e.target.closest('[data-open-pdf]');
      if (!trg) return;
      e.preventDefault();
      const id = trg.dataset.openPdf;
      const ed = window.VCTV_DATA.helpers.getById(id);
      if (ed) open(ed);
    });
    setTimeout(handleInitialHash, 500);
  }

  window.VCTV_PDF = { init, open, close, state };
})();
