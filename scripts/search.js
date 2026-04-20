/* ═══════════════════════════════════════════════════════════════
   VCtv TM — search.js
   Busca inteligente com duas camadas:
   1) Busca local por título/tag/descrição (sempre);
   2) Busca por IA via Pollinations (texto) — interpreta linguagem
      natural e devolve IDs de edições do catálogo.
   Dropdown de sugestões flutuante, atalho "/" pra focar.
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;
  const POLL_URL = 'https://text.pollinations.ai/';
  const MAX_LOCAL = 6;

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function localSearch(query) {
    const q = normalize(query);
    if (!q) return [];
    const eds = window.VCTV_DATA.EDICOES || [];
    const scored = eds.map((ed) => {
      const title = normalize(ed.titulo);
      const desc = normalize(ed.descricao || ed.resumo);
      const tags = ((ed.tags || ed.temas) || []).map(normalize).join(' ');
      let score = 0;
      if (title === q) score += 100;
      if (title.startsWith(q)) score += 50;
      if (title.includes(q)) score += 30;
      if (tags.includes(q)) score += 20;
      if (desc.includes(q)) score += 10;
      /* match palavras */
      q.split(/\s+/).filter(Boolean).forEach((w) => {
        if (title.includes(w)) score += 6;
        if (tags.includes(w)) score += 4;
        if (desc.includes(w)) score += 2;
      });
      return { ed, score };
    });
    return scored
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_LOCAL)
      .map((x) => x.ed);
  }

  async function aiSearch(query) {
    const catalog = (window.VCTV_DATA.EDICOES || []).map((ed) => ({
      id: ed.id,
      titulo: ed.titulo,
      tags: ed.tags || ed.temas || [],
      resumo: (ed.descricao || ed.resumo || '').slice(0, 140),
    }));

    const prompt =
      'Você é o VCai, buscador do jornal digital VCtv TM. Abaixo um catálogo JSON de edições.\n' +
      'O usuário fez esta busca em linguagem natural: "' + query + '"\n\n' +
      'Retorne APENAS um JSON com o formato: {"ids":["id1","id2"],"explicacao":"frase curta em PT-BR"}.\n' +
      'Inclua no máximo 4 IDs em ordem de relevância. Se nada bater, devolva {"ids":[],"explicacao":"..."}.\n' +
      'Nunca invente IDs — só use os do catálogo.\n\n' +
      'CATÁLOGO:\n' + JSON.stringify(catalog);

    const url = POLL_URL + encodeURIComponent(prompt) + '?model=openai&json=true';
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error('AI search http ' + res.status);
    const text = await res.text();
    /* Tenta parsear; se vier markdown, extrai bloco JSON */
    let data;
    try { data = JSON.parse(text); }
    catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) data = JSON.parse(m[0]);
      else throw new Error('resposta inválida');
    }
    const ids = Array.isArray(data.ids) ? data.ids : [];
    const eds = ids.map((id) => window.VCTV_DATA.helpers.getById(id)).filter(Boolean);
    return { editions: eds, explanation: data.explicacao || '' };
  }

  function renderSuggestions(host, items, opts) {
    host.innerHTML = '';
    if (!items.length) {
      host.appendChild(U.create('div', { class: 'search-empty' }, 'Nada encontrado 🕳️'));
      host.classList.add('is-open');
      return;
    }
    items.forEach((ed) => {
      const row = U.create('a', {
        class: 'search-suggestion',
        href: '#/edicao/' + ed.id,
        'data-id': ed.id,
      });
      row.appendChild(U.create('span', { class: 'search-suggestion__icon' }, ed.tipo === 'mini' ? '⚡' : '📰'));
      row.appendChild(U.create('span', { class: 'search-suggestion__title' }, ed.titulo));
      if (ed.data) {
        row.appendChild(U.create('span', { class: 'search-suggestion__meta' }, U.formatDateShort(ed.data)));
      }
      row.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.VCTV_PDF && window.VCTV_PDF.open) window.VCTV_PDF.open(ed);
        host.classList.remove('is-open');
      });
      host.appendChild(row);
    });
    if (opts && opts.explanation) {
      host.appendChild(U.create('div', { class: 'search-explanation' }, '✨ ' + opts.explanation));
    }
    host.classList.add('is-open');
  }

  function renderLoading(host) {
    host.innerHTML = '';
    const el = U.create('div', { class: 'search-loading' });
    el.innerHTML = '<span class="search-loading__dot"></span><span class="search-loading__dot"></span><span class="search-loading__dot"></span> VCai pensando…';
    host.appendChild(el);
    host.classList.add('is-open');
  }

  function attach(input, suggHost, aiBtn) {
    let lastQuery = '';
    let ctrl = null;

    const doLocal = U.debounce(() => {
      const q = input.value.trim();
      lastQuery = q;
      if (!q) { suggHost.classList.remove('is-open'); return; }
      const items = localSearch(q);
      renderSuggestions(suggHost, items);
    }, 180);

    input.addEventListener('input', doLocal);

    input.addEventListener('focus', () => {
      if (input.value.trim()) doLocal();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runAI();
      }
      if (e.key === 'Escape') {
        suggHost.classList.remove('is-open');
        input.blur();
      }
    });

    document.addEventListener('click', (e) => {
      if (!suggHost.contains(e.target) && e.target !== input) {
        suggHost.classList.remove('is-open');
      }
    });

    async function runAI() {
      const q = input.value.trim();
      if (!q) return;
      if (ctrl) ctrl.abort();
      ctrl = new AbortController();
      renderLoading(suggHost);
      try {
        const { editions, explanation } = await aiSearch(q);
        if (editions.length) {
          renderSuggestions(suggHost, editions, { explanation });
        } else {
          /* Fallback p/ local se IA falhou em trazer resultados */
          const items = localSearch(q);
          renderSuggestions(suggHost, items, { explanation: explanation || 'Mostrando resultados locais.' });
        }
      } catch (err) {
        const items = localSearch(q);
        renderSuggestions(suggHost, items, {
          explanation: 'VCai offline. Mostrando resultados locais.',
        });
      }
    }

    if (aiBtn) aiBtn.addEventListener('click', runAI);

    /* Atalho "/" pra focar, ignorando se já está em input */
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const ae = document.activeElement;
        if (ae && ['INPUT', 'TEXTAREA'].includes(ae.tagName)) return;
        e.preventDefault();
        input.focus();
      }
    });
  }

  function init() {
    const input = U.qs('#search-input');
    const suggHost = U.qs('#search-suggestions');
    const aiBtn = U.qs('#search-ai-btn');
    if (!input || !suggHost) return;
    attach(input, suggHost, aiBtn);
  }

  window.VCTV_SEARCH = { init, localSearch, aiSearch };
})();
