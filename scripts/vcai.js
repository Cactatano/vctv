/* ═══════════════════════════════════════════════════════════════
   VCtv TM — vcai.js
   Mascote-chatbot VCai 2.0. UI em Liquid Glass, botão flutuante
   (FAB) + painel lateral. Integra com Pollinations.
   =========================================================== */

(function () {
  'use strict';

  const U = window.VCTV_UTILS;
  const HIST_KEY = 'vctv-vcai-history';
  const MAX_HISTORY = 40;

  const state = {
    open: false,
    sending: false,
    messages: [],
    ctrl: null,
    lastUserText: null,
  };

  /* ─── SYSTEM PROMPT ─────────────────────────────────── */
  function buildSystemPrompt() {
    const catalogSummary = window.VCTV_DATA && window.VCTV_DATA.helpers && window.VCTV_DATA.helpers.catalogSummary
      ? window.VCTV_DATA.helpers.catalogSummary()
      : '(sem catálogo disponível)';

    return (
      'Você é o VCai 2.0, o mascote-assistente do jornal digital VCtv TM. ' +
      'Você conversa em português brasileiro, tom caloroso, divertido, curto e direto. ' +
      'Sua missão: guiar o leitor pelas edições do jornal, responder dúvidas sobre conteúdo, ajudar a achar a edição certa e celebrar a "nova era" do site. ' +
      'Nunca invente edições — só cite as do catálogo abaixo. Quando recomendar uma edição, inclua o id entre parênteses assim: (id: abc123). ' +
      'Se perguntarem quem fez o jornal: Caetano, Jaron e Érico — amigos do 6º ano do Fundamental II. ' +
      'Jornal criado em 2023. Lema: "Mesma essência. Nova era." 💜💚 ' +
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
      if (errPost.name === 'AbortError') throw errPost;
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

  /* ─── UI BUILD ───────────────────────────────────────── */
  function buildFab() {
    const fab = U.create('button', {
      id: 'vcai-fab',
      class: 'vcai-fab glass-circle glass-circle-lg',
      'aria-label': 'Abrir VCai — assistente VCtv',
      type: 'button',
    });
    fab.innerHTML =
      '<span class="vcai-fab__mascot" aria-hidden="true">' + avatarSVG() + '</span>' +
      '<span class="vcai-fab__ping" aria-hidden="true"></span>';
    fab.addEventListener('click', toggle);
    return fab;
  }

  /* Avatar SVG — cartucho redondo com "V" gradient + olhinhos */
  function avatarSVG(size) {
    const s = size || 36;
    return (
      '<svg viewBox="0 0 40 40" width="' + s + '" height="' + s + '" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="vcai-grad" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#a050f0"/>' +
            '<stop offset="100%" stop-color="#00e66e"/>' +
          '</linearGradient>' +
          '<radialGradient id="vcai-shine" cx="30%" cy="25%" r="45%">' +
            '<stop offset="0%" stop-color="rgba(255,255,255,0.8)"/>' +
            '<stop offset="100%" stop-color="rgba(255,255,255,0)"/>' +
          '</radialGradient>' +
        '</defs>' +
        '<circle cx="20" cy="20" r="19" fill="url(#vcai-grad)"/>' +
        '<circle cx="20" cy="20" r="19" fill="url(#vcai-shine)"/>' +
        '<path d="M11 13 L20 26 L29 13" stroke="#efece6" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
        '<circle class="vcai-eye vcai-eye--l" cx="14" cy="31" r="1.3" fill="#efece6"/>' +
        '<circle class="vcai-eye vcai-eye--r" cx="26" cy="31" r="1.3" fill="#efece6"/>' +
      '</svg>'
    );
  }

  function buildPanel() {
    const panel = U.create('div', {
      id: 'vcai-panel',
      class: 'vcai-panel glass-card-strong',
      role: 'dialog',
      'aria-label': 'Chat com VCai',
      'aria-hidden': 'true',
    });

    /* ── Header ── */
    const header = U.create('header', { class: 'vcai-header' });
    const mascot = U.create('div', { class: 'vcai-header__mascot' });
    mascot.innerHTML = avatarSVG(44);
    const title = U.create('div', { class: 'vcai-header__title' });
    title.innerHTML =
      '<strong style="font-family:var(--font-display);letter-spacing:-0.02em;">VCai 2.0</strong>' +
      '<span class="vcai-header__status"><span class="vcai-header__dot"></span>Online · prontinho</span>';
    const actions = U.create('div', { class: 'vcai-header__actions' });

    const clearBtn = U.create('button', {
      class: 'vcai-header__btn glass-circle',
      'aria-label': 'Limpar conversa', title: 'Limpar conversa', type: 'button',
    }, '🧹');
    const closeBtn = U.create('button', {
      class: 'vcai-header__btn glass-circle',
      'aria-label': 'Fechar VCai', title: 'Fechar (Esc)', type: 'button',
    }, '×');

    clearBtn.addEventListener('click', () => {
      if (!confirm('Limpar toda a conversa?')) return;
      clearHistory();
    });
    closeBtn.addEventListener('click', close);

    actions.appendChild(clearBtn);
    actions.appendChild(closeBtn);
    header.appendChild(mascot);
    header.appendChild(title);
    header.appendChild(actions);
    panel.appendChild(header);

    /* ── Mensagens ── */
    const messages = U.create('div', { class: 'vcai-messages', id: 'vcai-messages' });
    panel.appendChild(messages);

    /* ── Quick suggestions ── */
    const quick = U.create('div', { class: 'vcai-quick', id: 'vcai-quick' });
    const suggestions = [
      { icon: '🗞️', text: 'Edição mais recente?' },
      { icon: '🤖', text: 'Tem edição sobre IA?' },
      { icon: '👥', text: 'Quem faz a VCtv?' },
      { icon: '⚡', text: 'Recomenda uma mini edição' },
      { icon: '🚀', text: 'Conta sobre espaço' },
    ];
    suggestions.forEach((s) => {
      const b = U.create('button', { class: 'vcai-quick__btn glass-pill', type: 'button' });
      b.innerHTML = '<span aria-hidden="true">' + s.icon + '</span> ' + U.escape(s.text);
      b.addEventListener('click', () => {
        const input = U.qs('#vcai-input');
        if (input) { input.value = s.text; autoGrowTextarea(input); send(); }
      });
      quick.appendChild(b);
    });
    panel.appendChild(quick);

    /* ── Input ── */
    const form = U.create('form', { class: 'vcai-input-area' });
    const inputWrap = U.create('div', { class: 'vcai-input-wrap' });

    const textarea = U.create('textarea', {
      id: 'vcai-input',
      class: 'vcai-input',
      placeholder: 'Pergunta qualquer coisa pro VCai…',
      'aria-label': 'Mensagem para VCai',
      autocomplete: 'off',
      rows: '1',
    });
    textarea.addEventListener('input', () => autoGrowTextarea(textarea));
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    const sendBtn = U.create('button', {
      id: 'vcai-send',
      class: 'vcai-send glass-circle',
      type: 'submit',
      'aria-label': 'Enviar mensagem',
      title: 'Enviar (Enter)',
    });
    sendBtn.innerHTML =
      '<svg class="vcai-send__ico-send" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M3 11L21 3L13 21L11 13L3 11Z"/>' +
      '</svg>' +
      '<svg class="vcai-send__ico-stop" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">' +
        '<rect x="5" y="5" width="14" height="14" rx="2"/>' +
      '</svg>';

    inputWrap.appendChild(textarea);
    inputWrap.appendChild(sendBtn);
    form.appendChild(inputWrap);

    const hint = U.create('div', { class: 'vcai-input-hint' });
    hint.innerHTML = '<kbd>Enter</kbd> envia · <kbd>Shift</kbd>+<kbd>Enter</kbd> quebra linha';
    form.appendChild(hint);

    form.addEventListener('submit', (e) => { e.preventDefault(); send(); });
    panel.appendChild(form);

    return panel;
  }

  function autoGrowTextarea(el) {
    el.style.height = 'auto';
    const h = Math.min(el.scrollHeight, 140);
    el.style.height = h + 'px';
  }

  /* ─── RENDER ─────────────────────────────────────────── */
  function formatText(text) {
    /* Escape + bold (**x**) + quebras + links (id: xxx) viram texto */
    let html = U.escape(String(text || ''));
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
    const quick = U.qs('#vcai-quick');
    const sendBtn = U.qs('#vcai-send');
    if (!host) return;
    host.innerHTML = '';

    /* Toggle do ícone send/stop */
    if (sendBtn) {
      sendBtn.classList.toggle('is-sending', state.sending);
      sendBtn.setAttribute('aria-label', state.sending ? 'Parar' : 'Enviar mensagem');
      sendBtn.setAttribute('title', state.sending ? 'Parar (Esc)' : 'Enviar (Enter)');
    }

    /* Mostra quick suggestions só quando não há mensagens */
    if (quick) quick.style.display = state.messages.length === 0 ? '' : 'none';

    if (state.messages.length === 0) {
      const welcome = U.create('div', { class: 'vcai-welcome' });
      welcome.innerHTML =
        '<div class="vcai-welcome__icon">' + avatarSVG(72) + '</div>' +
        '<h3 class="vcai-welcome__title">Oi! Eu sou o VCai 2.0</h3>' +
        '<p class="vcai-welcome__text">Pergunta qualquer coisa sobre as edições da VCtv TM. Recomendo leituras, conto quem escreveu, explico temas e mando direto pro PDF. 💜💚</p>';
      host.appendChild(welcome);
    } else {
      let prevRole = null;
      state.messages.forEach((m, i) => {
        const isUser = m.role === 'user';
        const group = U.create('div', {
          class: 'vcai-bubble-group vcai-bubble-group--' + (isUser ? 'user' : 'bot'),
        });

        /* Avatar só no primeiro da sequência do bot */
        if (!isUser && prevRole !== 'assistant') {
          const av = U.create('div', { class: 'vcai-avatar' });
          av.innerHTML = avatarSVG(28);
          group.appendChild(av);
        } else if (!isUser) {
          group.appendChild(U.create('div', { class: 'vcai-avatar vcai-avatar--spacer' }));
        }

        const stack = U.create('div', { class: 'vcai-stack' });
        const bubble = U.create('div', {
          class: 'vcai-bubble vcai-bubble--' + (isUser ? 'user' : 'bot'),
        });
        const textEl = U.create('div', { class: 'vcai-bubble__text' });
        textEl.innerHTML = formatText(m.content);
        bubble.appendChild(textEl);
        stack.appendChild(bubble);

        if (m.ts) {
          const time = U.create('div', { class: 'vcai-time' }, formatTime(m.ts));
          stack.appendChild(time);
        }

        /* Chips das edições citadas (follow-ups) nas mensagens do bot */
        if (!isUser) {
          const tray = buildFollowUps(m.content);
          if (tray) stack.appendChild(tray);
        }

        /* Retry na última mensagem do bot se foi erro */
        if (!isUser && m.error && i === state.messages.length - 1) {
          const retryBtn = U.create('button', { class: 'vcai-retry glass-pill', type: 'button' }, '↻ Tentar de novo');
          retryBtn.addEventListener('click', () => {
            state.messages.pop();
            if (state.lastUserText) {
              saveHistory();
              state.sending = true;
              renderMessages();
              doSend(state.lastUserText);
            }
          });
          stack.appendChild(retryBtn);
        }

        group.appendChild(stack);
        host.appendChild(group);
        prevRole = m.role;
      });
    }

    if (state.sending) {
      const group = U.create('div', { class: 'vcai-bubble-group vcai-bubble-group--bot' });
      const av = U.create('div', { class: 'vcai-avatar' });
      av.innerHTML = avatarSVG(28);
      group.appendChild(av);
      const bubble = U.create('div', { class: 'vcai-bubble vcai-bubble--bot vcai-typing' });
      bubble.innerHTML =
        '<span class="vcai-typing__dot"></span>' +
        '<span class="vcai-typing__dot"></span>' +
        '<span class="vcai-typing__dot"></span>';
      group.appendChild(bubble);
      host.appendChild(group);
    }

    host.scrollTop = host.scrollHeight;
  }

  function buildFollowUps(text) {
    const ids = (String(text).match(/\(id:\s*([a-z0-9\-_]+)\)/gi) || [])
      .map((m) => m.replace(/\(id:\s*/i, '').replace(/\)/, '').trim());
    if (!ids.length) return null;
    const tray = U.create('div', { class: 'vcai-followups' });
    let added = 0;
    ids.forEach((id) => {
      const ed = window.VCTV_DATA && window.VCTV_DATA.helpers.getById(id);
      if (!ed) return;
      const chip = U.create('button', {
        class: 'vcai-followups__chip glass-pill',
        type: 'button',
      });
      chip.innerHTML =
        '<span class="vcai-followups__icon">' + (ed.tipo === 'mini' ? '⚡' : ed.tipo === 'especial' ? '✨' : '📰') + '</span>' +
        '<span class="vcai-followups__title">' + U.escape(ed.titulo) + '</span>' +
        '<span class="vcai-followups__cta">abrir →</span>';
      chip.addEventListener('click', () => {
        if (window.VCTV_PDF && window.VCTV_PDF.open) window.VCTV_PDF.open(ed);
      });
      tray.appendChild(chip);
      added += 1;
    });
    return added ? tray : null;
  }

  async function send() {
    /* Se estiver enviando, o botão vira "parar" */
    if (state.sending) {
      if (state.ctrl) state.ctrl.abort();
      state.sending = false;
      renderMessages();
      return;
    }
    const input = U.qs('#vcai-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    autoGrowTextarea(input);
    state.lastUserText = text;
    addUserMessage(text);
    state.sending = true;
    renderMessages();
    doSend(text);
  }

  async function doSend(text) {
    try {
      const reply = await callAI(text);
      state.sending = false;
      addBotMessage(cleanReply(reply));
    } catch (err) {
      state.sending = false;
      if (err.name === 'AbortError') {
        state.messages.push({
          role: 'assistant',
          content: '_Parado por você._',
          ts: Date.now(),
        });
      } else {
        state.messages.push({
          role: 'assistant',
          content: 'Ops, deu ruim com a conexão. Tenta de novo? 😅',
          ts: Date.now(),
          error: true,
        });
      }
      saveHistory();
      renderMessages();
    }
  }

  function cleanReply(text) {
    return String(text || '').trim();
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
    if (state.sending && state.ctrl) {
      state.ctrl.abort();
      state.sending = false;
    }
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
