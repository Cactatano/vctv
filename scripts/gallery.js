/* ═══════════════════════════════════════════════════════════════
   VCtv TM — gallery.js
   Galeria de capas renderizadas via pdf.js (primeira página como
   <canvas> + fallback pra placeholder).  Lazy load via
   IntersectionObserver — só renderiza quando entra na viewport.
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;
  const PDFJS_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  let pdfjsReady = null;

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

  async function renderCover(canvas, pdfUrl, opts) {
    const pdfjsLib = await loadPdfJs();
    const scale = (opts && opts.scale) || 1.1;
    const task = pdfjsLib.getDocument({ url: pdfUrl, disableRange: false });
    const doc = await task.promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale });
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    await page.render({ canvasContext: ctx, viewport }).promise;
    try { doc.cleanup(); doc.destroy(); } catch {}
  }

  function buildItem(ed) {
    const pdfUrl = ed.pdf || ed.arquivo || '';
    const item = U.create('article', {
      class: 'gallery-item glass-card',
      'data-id': ed.id,
      'data-pdf': pdfUrl,
      tabindex: '0',
      role: 'button',
      'aria-label': 'Abrir edição ' + ed.titulo,
    });

    const frame = U.create('div', { class: 'gallery-item__frame' });
    const canvas = U.create('canvas', { class: 'gallery-item__canvas', 'aria-hidden': 'true' });
    frame.appendChild(canvas);

    /* Skeleton enquanto carrega */
    const skeleton = U.create('div', { class: 'gallery-item__skeleton skeleton' });
    frame.appendChild(skeleton);

    /* Fallback se der erro */
    const fallback = U.create('div', { class: 'gallery-item__fallback' });
    fallback.innerHTML = '<span style="font-size:3rem;">📰</span>';
    frame.appendChild(fallback);

    item.appendChild(frame);

    const meta = U.create('div', { class: 'gallery-item__meta' });
    meta.appendChild(U.create('h3', { class: 'gallery-item__title' }, ed.titulo));
    if (ed.data) {
      meta.appendChild(U.create('div', { class: 'gallery-item__date' }, U.formatDate(ed.data)));
    }
    item.appendChild(meta);

    /* Click/Enter abre o leitor */
    const open = () => {
      if (window.VCTV_PDF && window.VCTV_PDF.open) window.VCTV_PDF.open(ed);
    };
    item.addEventListener('click', open);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    return { item, canvas, skeleton, fallback };
  }

  function observeAndRender(entry) {
    const { item, canvas, skeleton, fallback } = entry;
    const pdf = item.dataset.pdf;
    if (!pdf) {
      skeleton.remove();
      fallback.classList.add('is-visible');
      return;
    }
    renderCover(canvas, pdf).then(() => {
      skeleton.remove();
      canvas.classList.add('is-loaded');
    }).catch(() => {
      skeleton.remove();
      fallback.classList.add('is-visible');
    });
  }

  function render() {
    const host = U.qs('#gallery-grid');
    if (!host) return;
    const eds = (window.VCTV_DATA.EDICOES || []).filter((e) => !!(e.pdf || e.arquivo));
    host.innerHTML = '';

    if (!eds.length) {
      host.appendChild(U.create('div', { class: 'empty-state glass-card-subtle' },
        'Nenhuma capa disponível por enquanto. Volte já já. 💜'));
      return;
    }

    const entries = [];
    eds.forEach((ed) => {
      const entry = buildItem(ed);
      host.appendChild(entry.item);
      entries.push(entry);
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((observed) => {
        observed.forEach((obs) => {
          if (obs.isIntersecting) {
            const entry = entries.find((e) => e.item === obs.target);
            if (entry) observeAndRender(entry);
            io.unobserve(obs.target);
          }
        });
      }, { rootMargin: '200px 0px', threshold: 0.01 });

      entries.forEach((e) => io.observe(e.item));
    } else {
      entries.forEach(observeAndRender);
    }
  }

  function init() {
    render();
  }

  window.VCTV_GALLERY = { init, render, renderCover };
})();
