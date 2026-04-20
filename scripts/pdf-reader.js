/* ═══════════════════════════════════════════════════════════════
   VCtv TM — pdf-reader.js
   Leitor de PDF embutido num modal Liquid Glass.  Usa pdf.js em
   modo viewer (primeira tentativa: iframe com pdf.js embed; se
   falhar, fallback pra renderização canvas página-a-página).
   Atalhos: ←/→ navega páginas, +/- zoom, F tela cheia, Esc fecha.
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;
  const PDFJS_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  let pdfjsReady = null;
  let state = {
    doc: null,
    page: 1,
    total: 1,
    scale: 1.2,
    edition: null,
    open: false,
  };

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

    /* Header */
    const header = U.create('header', { class: 'pdf-reader__header' });
    header.appendChild(U.create('div', { class: 'pdf-reader__title', id: 'pdf-title' }, ''));
    const headerRight = U.create('div', { class: 'pdf-reader__actions' });

    const btnShare = U.create('button', {
      class: 'pdf-reader__btn glass-circle',
      'aria-label': 'Compartilhar edição',
      type: 'button',
      title: 'Compartilhar',
    }, '🔗');
    const btnDownload = U.create('button', {
      class: 'pdf-reader__btn glass-circle',
      'aria-label': 'Baixar PDF',
      type: 'button',
      title: 'Baixar',
    }, '⬇');
    const btnFs = U.create('button', {
      class: 'pdf-reader__btn glass-circle',
      'aria-label': 'Tela cheia',
      type: 'button',
      title: 'Tela cheia (F)',
    }, '⛶');
    const btnClose = U.create('button', {
      class: 'pdf-reader__btn pdf-reader__btn--close glass-circle',
      'aria-label': 'Fechar leitor',
      type: 'button',
      title: 'Fechar (Esc)',
    }, '×');

    [btnShare, btnDownload, btnFs, btnClose].forEach((b) => headerRight.appendChild(b));
    header.appendChild(headerRight);
    modal.appendChild(header);

    /* Viewport */
    const viewport = U.create('div', { class: 'pdf-reader__viewport', id: 'pdf-viewport' });
    const canvas = U.create('canvas', { class: 'pdf-reader__canvas', id: 'pdf-canvas' });
    viewport.appendChild(canvas);

    const loading = U.create('div', { class: 'pdf-reader__loading', id: 'pdf-loading' });
    loading.innerHTML = '<div class="skeleton" style="width:300px;height:400px;border-radius:18px;"></div>';
    viewport.appendChild(loading);

    modal.appendChild(viewport);

    /* Footer: navegação */
    const footer = U.create('footer', { class: 'pdf-reader__footer' });

    const navPrev = U.create('button', {
      class: 'pdf-reader__nav glass-circle',
      'aria-label': 'Página anterior',
      type: 'button',
    }, '‹');
    const pageInfo = U.create('div', { class: 'pdf-reader__pageinfo', id: 'pdf-pageinfo' }, '1 / 1');
    const navNext = U.create('button', {
      class: 'pdf-reader__nav glass-circle',
      'aria-label': 'Próxima página',
      type: 'button',
    }, '›');

    const zoomOut = U.create('button', {
      class: 'pdf-reader__zoom glass-pill',
      'aria-label': 'Diminuir zoom',
      type: 'button',
    }, '−');
    const zoomLabel = U.create('div', { class: 'pdf-reader__zoomlabel', id: 'pdf-zoomlabel' }, '120%');
    const zoomIn = U.create('button', {
      class: 'pdf-reader__zoom glass-pill',
      'aria-label': 'Aumentar zoom',
      type: 'button',
    }, '+');

    footer.appendChild(navPrev);
    footer.appendChild(pageInfo);
    footer.appendChild(navNext);
    footer.appendChild(U.create('div', { class: 'pdf-reader__spacer' }));
    footer.appendChild(zoomOut);
    footer.appendChild(zoomLabel);
    footer.appendChild(zoomIn);

    modal.appendChild(footer);
    overlay.appendChild(modal);

    /* Handlers */
    btnClose.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    btnShare.addEventListener('click', shareCurrent);
    btnDownload.addEventListener('click', downloadCurrent);
    btnFs.addEventListener('click', toggleFullscreen);
    navPrev.addEventListener('click', prevPage);
    navNext.addEventListener('click', nextPage);
    zoomIn.addEventListener('click', () => setScale(state.scale + 0.2));
    zoomOut.addEventListener('click', () => setScale(state.scale - 0.2));

    document.body.appendChild(overlay);
    return overlay;
  }

  async function loadDoc(url) {
    const pdfjsLib = await loadPdfJs();
    const task = pdfjsLib.getDocument({ url });
    state.doc = await task.promise;
    state.total = state.doc.numPages;
    state.page = 1;
  }

  async function renderPage() {
    if (!state.doc) return;
    const canvas = U.qs('#pdf-canvas');
    const loading = U.qs('#pdf-loading');
    if (loading) loading.style.display = 'flex';
    const page = await state.doc.getPage(state.page);
    const viewport = page.getViewport({ scale: state.scale });
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
  }

  function setScale(s) {
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
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
    if (e.key === '+' || e.key === '=') setScale(state.scale + 0.2);
    if (e.key === '-' || e.key === '_') setScale(state.scale - 0.2);
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  }

  async function open(edition) {
    if (!edition) return;
    const pdfUrl = edition.pdf || edition.arquivo;
    if (!pdfUrl) return;
    state.edition = edition;
    state.pdfUrl = pdfUrl;
    state.open = true;

    let overlay = U.qs('#pdf-reader-overlay');
    if (!overlay) overlay = buildModal();
    overlay.classList.add('is-open');
    document.body.classList.add('has-modal');

    const title = U.qs('#pdf-title');
    if (title) title.textContent = edition.titulo;

    try {
      await loadDoc(pdfUrl);
      await renderPage();
    } catch (err) {
      const loading = U.qs('#pdf-loading');
      if (loading) {
        loading.innerHTML =
          '<div class="glass-card-subtle" style="padding:24px;text-align:center;max-width:420px;">' +
            '<div style="font-size:3rem;">📄</div>' +
            '<h3 style="margin:12px 0 6px;">Não deu pra abrir por aqui</h3>' +
            '<p style="color:var(--text-muted);margin:0 0 12px;">Clique abaixo pra abrir direto no navegador.</p>' +
            '<a class="btn-primary has-ripple" href="' + U.escape(pdfUrl) + '" target="_blank" rel="noopener">Abrir PDF →</a>' +
          '</div>';
      }
    }

    location.hash = '#/edicao/' + edition.id;
    U.emit('vctv:edition-opened', { id: edition.id });
  }

  function close() {
    const overlay = U.qs('#pdf-reader-overlay');
    if (overlay) overlay.classList.remove('is-open');
    document.body.classList.remove('has-modal');
    state.open = false;
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
    /* Delega clique em qualquer [data-open-pdf="id"] */
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
