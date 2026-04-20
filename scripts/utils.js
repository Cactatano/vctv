/* ═══════════════════════════════════════════════════════════════
   VCtv TM — utils.js
   Coleção de helpers genéricos: DOM, escape, throttle/debounce,
   localStorage seguro, toasts, detect OS/browser, formatação
   de datas, etc.  Tudo namespaceado em window.VCTV_UTILS.
   =========================================================== */

(function () {
  'use strict';

  const U = {};

  /* ─── DOM ────────────────────────────────────────────── */
  U.qs  = (sel, root) => (root || document).querySelector(sel);
  U.qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  U.create = (tag, props, children) => {
    const el = document.createElement(tag);
    if (props) {
      for (const k in props) {
        if (k === 'class' || k === 'className') el.className = props[k];
        else if (k === 'style' && typeof props[k] === 'object') Object.assign(el.style, props[k]);
        else if (k === 'dataset' && typeof props[k] === 'object') Object.assign(el.dataset, props[k]);
        else if (k.startsWith('on') && typeof props[k] === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), props[k]);
        } else if (k === 'html') el.innerHTML = props[k];
        else el.setAttribute(k, props[k]);
      }
    }
    if (children) {
      const arr = Array.isArray(children) ? children : [children];
      arr.forEach((c) => {
        if (c == null) return;
        if (typeof c === 'string') el.appendChild(document.createTextNode(c));
        else el.appendChild(c);
      });
    }
    return el;
  };

  /* Template literal → nodes */
  U.html = (strings, ...values) => {
    const raw = strings.reduce((acc, s, i) => acc + s + (values[i] !== undefined ? values[i] : ''), '');
    const tpl = document.createElement('template');
    tpl.innerHTML = raw.trim();
    return tpl.content.firstChild;
  };

  /* Insere evento com cleanup retornado */
  U.on = (target, event, handler, opts) => {
    target.addEventListener(event, handler, opts);
    return () => target.removeEventListener(event, handler, opts);
  };

  /* Delegation */
  U.delegate = (root, selector, event, handler) => {
    return U.on(root, event, (e) => {
      const match = e.target.closest(selector);
      if (match && root.contains(match)) handler(e, match);
    });
  };

  /* ─── ESCAPE ─────────────────────────────────────────── */
  U.escape = (str) =>
    String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  /* ─── TIMING ─────────────────────────────────────────── */
  U.debounce = (fn, wait) => {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  U.throttle = (fn, wait) => {
    let last = 0, timer;
    return function (...args) {
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        if (timer) { clearTimeout(timer); timer = null; }
        last = now;
        fn.apply(this, args);
      } else if (!timer) {
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          fn.apply(this, args);
        }, remaining);
      }
    };
  };

  U.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  U.nextFrame = () => new Promise((r) => requestAnimationFrame(r));

  /* ─── STORAGE (seguro, não quebra se localStorage bloqueado) ─ */
  U.storage = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        if (v == null) return fallback;
        try { return JSON.parse(v); } catch { return v; }
      } catch { return fallback; }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        return true;
      } catch { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(key); return true; } catch { return false; }
    },
    has(key) {
      try { return localStorage.getItem(key) != null; } catch { return false; }
    },
  };

  /* ─── NUMBERS / DATES ───────────────────────────────── */
  U.formatNumber = (n) => {
    return new Intl.NumberFormat('pt-BR').format(n);
  };

  U.formatDate = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  U.formatDateShort = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  U.timeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'agora';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}min atrás`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h atrás`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d atrás`;
    return U.formatDateShort(d);
  };

  /* ─── DETECT DEVICE ──────────────────────────────────── */
  U.device = {
    isIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    },
    isSafari() {
      const ua = navigator.userAgent;
      return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
    },
    isAndroid() {
      return /Android/i.test(navigator.userAgent);
    },
    isMobile() {
      return window.matchMedia('(max-width: 767px)').matches ||
        /Android|iPhone|iPad|iPod/.test(navigator.userAgent);
    },
    isStandalone() {
      return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
    },
    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
  };

  /* ─── TOAST SYSTEM ───────────────────────────────────── */
  U.toast = function (opts) {
    const o = typeof opts === 'string'
      ? { title: opts }
      : Object.assign({ title: '', text: '', icon: '✨', duration: 3000, type: 'info' }, opts || {});

    let stack = document.getElementById('toast-stack');
    if (!stack) {
      stack = U.create('div', { id: 'toast-stack', class: 'toast-stack', 'aria-live': 'polite' });
      document.body.appendChild(stack);
    }

    const toast = U.create('div', { class: `toast glass-pill toast--${o.type}` }, [
      U.create('div', { class: 'toast__icon' }, o.icon),
      U.create('div', { class: 'toast__body' }, [
        o.title ? U.create('div', { class: 'toast__title' }, o.title) : null,
        o.text ? U.create('div', { class: 'toast__text' }, o.text) : null,
      ]),
    ]);

    stack.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('is-closing');
      setTimeout(() => toast.remove(), 300);
    }, o.duration);

    return toast;
  };

  U.toast.success = (msg, text) => U.toast({ title: msg, text: text, icon: '✅', type: 'success' });
  U.toast.error   = (msg, text) => U.toast({ title: msg, text: text, icon: '⚠️', type: 'error' });
  U.toast.info    = (msg, text) => U.toast({ title: msg, text: text, icon: 'ℹ️', type: 'info' });

  /* ─── RIPPLE EFFECT ──────────────────────────────────── */
  U.attachRipple = (el) => {
    el.classList.add('ripple-container');
    el.addEventListener('click', function (e) {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = (e.clientX || (rect.left + rect.width / 2)) - rect.left - size / 2;
      const y = (e.clientY || (rect.top + rect.height / 2)) - rect.top - size / 2;
      const ripple = U.create('span', { class: 'ripple' });
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  };

  /* ─── INTERSECTION OBSERVER ─ reveal generico ────────── */
  U.createRevealObserver = (opts) => {
    const options = Object.assign({
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
      className: 'is-visible',
      once: true,
    }, opts || {});

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(options.className);
          if (options.once) observer.unobserve(entry.target);
        } else if (!options.once) {
          entry.target.classList.remove(options.className);
        }
      });
    }, { threshold: options.threshold, rootMargin: options.rootMargin });

    return observer;
  };

  /* ─── ANIMATE COUNTER ────────────────────────────────── */
  U.animateCounter = (el, target, duration) => {
    const dur = duration || 1500;
    const start = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = Math.round(start + (target - start) * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ─── SHARE ──────────────────────────────────────────── */
  U.share = async (data) => {
    const payload = Object.assign({
      title: 'VCtv TM',
      text: 'O jornal feito por você, pra VC.',
      url: window.location.href,
    }, data || {});

    if (navigator.share) {
      try { await navigator.share(payload); return true; }
      catch { return false; }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(payload.url);
        U.toast.success('Link copiado!', 'Cole onde quiser compartilhar.');
        return true;
      } catch { return false; }
    }
    return false;
  };

  /* ─── DOWNLOAD ───────────────────────────────────────── */
  U.download = async (url, saveAs) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('404');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = U.create('a', { href: blobUrl, download: saveAs || url.split('/').pop() });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      return true;
    } catch {
      window.open(url, '_blank');
      return false;
    }
  };

  /* ─── CLAMP ──────────────────────────────────────────── */
  U.clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  /* ─── UUID / ID ──────────────────────────────────────── */
  U.uid = (prefix) => {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);
  };

  /* ─── EMIT CUSTOM EVENT ──────────────────────────────── */
  U.emit = (name, detail) => {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  };

  /* ─── RAF-SCHEDULE ───────────────────────────────────── */
  U.rafSchedule = (fn) => {
    let id = null;
    return function (...args) {
      if (id) return;
      id = requestAnimationFrame(() => {
        fn.apply(this, args);
        id = null;
      });
    };
  };

  /* ─── EXPORT ─────────────────────────────────────────── */
  window.VCTV_UTILS = U;
})();
