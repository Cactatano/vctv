/* ═══════════════════════════════════════════════════════════════
   VCtv TM — vcai.js
   Mascote-chatbot VCai 2.0.  UI em Liquid Glass, botão flutuante
   (FAB) + painel lateral.  Integra com Pollinations (text.pollinations.ai)
   usando um system prompt que inclui o catálogo resumido das edições.
   Guarda histórico em localStorage.
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;
  const POLL_URL = 'https://text.pollinations.ai/';
  const HIST_KEY = 'vctv-vcai-history';
  const MAX_HISTORY = 40;

  const state = {
    open: false,
    sending: false,
    messages: [],
    ctrl: null,
  };

  /* ─── SYSTEM PROMPT ─────────────────────────────────── */
  function buildSystemPrompt() {
    const catalogSummary = window.VCTV_DATA && window.VCTV_DATA.helpers && window.VCTV_DATA.helpers.catalogSummary
      ? window.VCTV_DATA.helpers.catalogSummary()
      : '(sem catálogo disponível)';

    return (
      'Você é o VCai 2.0, o mascote-assistente do jornal digital VCtv TM. ' +
      'Você conversa em português brasileiro, tom caloroso, divertido, um pouco nerd, curto e direto. ' +
      'Sua missão: guiar o leitor pelas edições do jornal, responder dúvidas sobre conteúdo, ajudar a achar a edição certa e celebrar a "nova era" do site. ' +
      'Nunca invente edições — só cite as do catálogo abaixo. Quando recomendar uma edição, inclua o id entre parênteses assim: (id: abc123). ' +
      'Se perguntarem quem fez o jornal: Caetano, Jaron e Érico — amigos do 6º ano do Fundamental II. ' +
      'Lema: "Mesma essência. Nova era." 💜💚 ' +
      'Evite respostas longas: máximo 4 frases. Use emojis com moderação (1-2 por resposta). ' +
      'Se o usuário parecer frustrado, seja empático. Se perguntarem algo fora do escopo da VCtv, responda curto e redirecione.\n\n' +
      'CATÁLOGO RESUMIDO:\n' + catalogSummary
    );
  }

  /* ─── HISTÓRICO ──────────────────────────────────────── */
  function loadHistory() {
    const v = U.storage.get(HIST_KEY, []);
    state.messages = Array.isArray(v) ? v.slice(-MAX_HISTORY) : [];
  }
  function saveHistory() {
    U.storage.set(HIST_KEY, state.messages.slice(-MAX_HISTORY));
  }
  function clearHistory() {
    state.messages = [];
    saveHistory();
    renderMessages();
    addBotMessage('Conversa zerada. Manda a pergunta nova! 💜');
  }

  /* ─── API ────────────────────────────────────────────── */
  async function callAI(userText) {
    const messages = [
      { role: 'system', content: buildSystemPrompt() },
      ...state.messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userText },
    ];

    if (state.ctrl) state.ctrl.abort();
    state.ctrl = new AbortController();

    /* Pollinations tem dois endpoints.  O POST em /openai é o
       formato OpenAI-compat; responde JSON com choices[].message.
       Se falhar (CORS, rate-limit), tenta o GET simples. */
    try {
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages,
          temperature: 0.7,
          private: true,
        }),
        signal: state.ctrl.signal,
      });
      if (!res.ok) throw new Error('post failed ' + res.status);
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        if (j.choices && j.choices[0] && j.choices[0].message) {
          return j.choices[0].message.content;
        }
        if (j.content) return j.content;
      } catch { /* texto puro */ }
      return text;
    } catch (errPost) {
      /* Fallback: GET com prompt concatenado (mais tolerante) */
      const flat = messages.map((m) =>
        (m.role === 'system' ? '[Instruções]: ' : m.role === 'user' ? '[Usuário]: ' : '[VCai]: ')
        + m.content
      ).join('\n\n') + '\n\n[VCai]:';
      const url = 'https://text.pollinations.ai/' + encodeURIComponent(flat)
        + '?model=openai&private=true';
      const res2 = await fetch(url, { signal: state.ctrl.signal });
      if (!res2.ok) throw new Error('get failed ' + res2.status);
      return await res2.text();
    }
  }

  /* ─── UI ─────────────────────────────────────────────── */
  function buildFab() {
    const fab = U.create('button', {
      id: 'vcai-fab',
      class: 'vcai-fab glass-circle glass-circle-lg',
      'aria-label': 'Abrir VCai — assistente VCtv',
      type: 'button',
    });
    fab.innerHTML =
      '<span class="vcai-fab__mascot" aria-hidden="true">✨</span>' +
      '<span class="vcai-fab__ping" aria-hidden="true"></span>';
    fab.addEventListener('click', toggle);
    return fab;
  }

  function buildPanel() {
    const panel = U.create('div', {
      id: 'vcai-panel',
      class: 'vcai-panel glass-card-strong',
      role: 'dialog',
      'aria-label': 'Chat com VCai',
      'aria-hidden': 'true',
    });

    /* Header */
    const header = U.create('header', { class: 'vcai-header' });
    const mascot = U.create('div', { class: 'vcai-header__mascot glass-circle' }, '💜');
    const title = U.create('div', { class: 'vcai-header__title' });
    title.innerHTML =
      '<strong style="font-family:var(--font-display);">VCai 2.0</strong>' +
      '<span style="font-size:0.75rem;color:var(--text-muted);">Assistente da VCtv TM</span>';
    const actions = U.create('div', { class: 'vcai-header__actions' });

    const clearBtn = U.create('button', {
      class: 'vcai-header__btn glass-circle',
      'aria-label': 'Limpar conversa',
      title: 'Limpar conversa',
      type: 'button',
    }, '🧹');
    const closeBtn = U.create('button', {
      class: 'vcai-header__btn glass-circle',
      'aria-label': 'Fechar VCai',
      title: 'Fechar',
      type: 'button',
    }, '×');

    clearBtn.addEventListener('click', clearHistory);
    closeBtn.addEventListener('click', close);

    actions.appendChild(clearBtn);
    actions.appendChild(closeBtn);
    header.appendChild(mascot);
    header.appendChild(title);
    header.appendChild(actions);
    panel.appendChild(header);

    /* Mensagens */
    const messages = U.create('div', { class: 'vcai-messages', id: 'vcai-messages' });
    panel.appendChild(messages);

    /* Quick suggestions */
    const quick = U.create('div', { class: 'vcai-quick' });
    const suggestions = [
      'Qual a edição mais recente?',
      'Tem edição sobre IA?',
      'Quem faz a VCtv?',
      'Me recomenda uma mini edição',
    ];
    suggestions.forEach((s) => {
      const b = U.create('button', { class: 'vcai-quick__btn glass-pill', type: 'button' }, s);
      b.addEventListener('click', () => {
        const input = U.qs('#vcai-input');
        if (input) { input.value = s; send(); }
      });
      quick.appendChild(b);
    });
    panel.appendChild(quick);

    /* Input */
    const form = U.create('form', { class: 'vcai-input-area' });
    const input = U.create('input', {
      id: 'vcai-input',
      class: 'vcai-input',
      type: 'text',
      placeholder: 'Pergunta pro VCai…',
      'aria-label': 'Mensagem para VCai',
      autocomplete: 'off',
    });
    const sendBtn = U.create('button', {
      id: 'vcai-send',
      class: 'vcai-send glass-circle',
      type: 'submit',
      'aria-label': 'Enviar mensagem',
    }, '➤');
    form.appendChild(input);
    form.appendChild(sendBtn);
    form.addEventListener('submit', (e) => { e.preventDefault(); send(); });
    panel.appendChild(form);

    return panel;
  }

  function addUserMessage(text) {
    state.messages.push({ role: 'user', content: text, ts: Date.now() });
    saveHistory();
    renderMessages();
  }

  function addBotMessage(text) {
    state.messages.push({ role: 'assistant', content: text, ts: Date.now() });
    saveHistory();
    renderMessages();
  }

  function renderMessages() {
    const host = U.qs('#vcai-messages');
    if (!host) return;
    host.innerHTML = '';

    if (state.messages.length === 0) {
      const welcome = U.create('div', { class: 'vcai-welcome' });
      welcome.innerHTML =
        '<div class="vcai-welcome__icon glass-circle glass-circle-lg">💜💚</div>' +
        '<h3 style="font-family:var(--font-display);margin:12px 0 4px;">Oi! Eu sou o VCai 2.0</h3>' +
        '<p style="color:var(--text-muted);margin:0;max-width:260px;">Pergunta qualquer coisa sobre as edições da VCtv TM. Tô aqui pra ajudar.</p>';
      host.appendChild(welcome);
    } else {
      state.messages.forEach((m) => {
        const bubble = U.create('div', {
          class: 'vcai-bubble vcai-bubble--' + (m.role === 'user' ? 'user' : 'bot'),
        });
        bubble.appendChild(U.create('div', { class: 'vcai-bubble__text' }, m.content));
        host.appendChild(bubble);
      });
    }

    if (state.sending) {
      const typing = U.create('div', { class: 'vcai-bubble vcai-bubble--bot vcai-typing' });
      typing.innerHTML =
        '<span class="vcai-typing__dot"></span>' +
        '<span class="vcai-typing__dot"></span>' +
        '<span class="vcai-typing__dot"></span>';
      host.appendChild(typing);
    }

    host.scrollTop = host.scrollHeight;
  }

  async function send() {
    const input = U.qs('#vcai-input');
    if (!input || state.sending) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUserMessage(text);
    state.sending = true;
    renderMessages();

    try {
      const reply = await callAI(text);
      state.sending = false;
      addBotMessage(cleanReply(reply));
      renderFollowUps(reply);
    } catch (err) {
      state.sending = false;
      addBotMessage('Ops, deu ruim com a conexão. Tenta de novo em um instante? 😅');
    }
  }

  function cleanReply(text) {
    /* Tira markdown excessivo da resposta (bold, títulos) mas mantém texto */
    return String(text || '').trim();
  }

  /* Quando o bot menciona (id: xxx), adiciona cards clicáveis abaixo */
  function renderFollowUps(reply) {
    const ids = (String(reply).match(/\(id:\s*([a-z0-9-_]+)\)/gi) || [])
      .map((m) => m.replace(/\(id:\s*/i, '').replace(/\)/, '').trim());
    if (!ids.length) return;
    const host = U.qs('#vcai-messages');
    if (!host) return;
    const tray = U.create('div', { class: 'vcai-followups' });
    ids.forEach((id) => {
      const ed = window.VCTV_DATA.helpers.getById(id);
      if (!ed) return;
      const chip = U.create('button', {
        class: 'vcai-followups__chip glass-pill',
        type: 'button',
      });
      chip.innerHTML =
        '<span style="font-size:1rem;">' + (ed.tipo === 'mini' ? '⚡' : '📰') + '</span> ' +
        U.escape(ed.titulo) + ' <span style="color:var(--text-muted);font-size:0.75rem;">abrir →</span>';
      chip.addEventListener('click', () => {
        if (window.VCTV_PDF && window.VCTV_PDF.open) window.VCTV_PDF.open(ed);
      });
      tray.appendChild(chip);
    });
    if (tray.children.length) host.appendChild(tray);
    host.scrollTop = host.scrollHeight;
  }

  /* ─── OPEN/CLOSE ─────────────────────────────────────── */
  function open() {
    const panel = U.qs('#vcai-panel');
    if (!panel) return;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    state.open = true;
    renderMessages();
    setTimeout(() => {
      const input = U.qs('#vcai-input');
      if (input) input.focus();
    }, 120);
  }

  function close() {
    const panel = U.qs('#vcai-panel');
    if (!panel) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    state.open = false;
  }

  function toggle() {
    if (state.open) close();
    else open();
  }

  function mount() {
    if (U.qs('#vcai-panel')) return;
    document.body.appendChild(buildFab());
    document.body.appendChild(buildPanel());
  }

  function bindGlobal() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.open) close();
      if (e.shiftKey && (e.key === '?' || e.key === '/')) {
        const ae = document.activeElement;
        if (ae && ['INPUT', 'TEXTAREA'].includes(ae.tagName)) return;
        toggle();
      }
    });
  }

  function init() {
    loadHistory();
    mount();
    bindGlobal();
  }

  window.VCTV_VCAI = { init, open, close, toggle, clearHistory, send };
})();
