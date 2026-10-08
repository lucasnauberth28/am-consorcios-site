/* AM Consórcios — site v2: calculadoras, menu, vídeo e envio de leads. */
(() => {
  'use strict';
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const short = (v) => v >= 1000000 ? 'R$ ' + (v / 1000000).toLocaleString('pt-BR') + ' mi' : 'R$ ' + (v / 1000) + ' mil';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CONSENT_VERSION = 'briefing-2026-10-05-v2';
  const API = new URL('api/briefings.php', location.href).toString();
  const page = document.body.dataset.calc || '';

  /* ---------- Menu do celular ---------- */
  document.querySelectorAll('.nav-menu').forEach((btn) => {
    const header = btn.closest('header');
    const nav = header && header.querySelector('nav.nav-links');
    if (!nav) return;
    const panel = document.createElement('div');
    panel.className = 'mobile-menu'; panel.id = 'menu-celular'; panel.hidden = true;
    nav.querySelectorAll('a').forEach((a) => {
      const c = a.cloneNode(true); c.removeAttribute('style'); c.removeAttribute('class'); panel.appendChild(c);
    });
    const wa = document.querySelector('.wa-float');
    if (wa) { const c = document.createElement('a'); c.href = wa.href; c.target = '_blank'; c.rel = 'noopener noreferrer'; c.textContent = 'Falar no WhatsApp'; panel.appendChild(c); }
    header.appendChild(panel);
    btn.setAttribute('aria-controls', panel.id); btn.setAttribute('aria-expanded', 'false');
    const set = (open) => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Fechar' : 'Menu'; };
    btn.addEventListener('click', () => set(panel.hidden));
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
  });

  /* ---------- Estado e renderização ---------- */
  const state = { sent: false, playing: !reduceMotion };
  let compute = () => ({});
  const actions = {};
  const listCache = new Map();

  function bindClone(root, item) {
    root.querySelectorAll('[data-bind]').forEach((el) => { const k = el.dataset.bind; if (k in item) el.textContent = item[k]; });
    root.querySelectorAll('[data-model]').forEach((el) => { const k = el.dataset.model; if (k in item) el.value = item[k]; el.removeAttribute('data-model'); });
  }

  function renderLists(v) {
    document.querySelectorAll('template[data-for]').forEach((t, idx) => {
      const name = t.dataset.for; const list = v[name] || [];
      const sig = JSON.stringify(list.map((i) => [i.label, i.value]));
      const key = name + ':' + idx;
      if (listCache.get(key) !== sig) {
        t.parentNode.querySelectorAll(`[data-clone="${key}"]`).forEach((n) => n.remove());
        const frag = document.createDocumentFragment();
        list.forEach((item, i) => {
          const c = t.content.cloneNode(true);
          const el = c.firstElementChild;
          bindClone(c, item);
          el.setAttribute('data-clone', key); el.dataset.index = i;
          if (el.tagName === 'BUTTON') {
            el.classList.add(name === 'quick' ? 'chip' : 'pill-opt');
            el.removeAttribute('data-action');
            el.addEventListener('click', () => { const cur = (compute()[name] || [])[i]; if (cur && cur.pick) cur.pick(); });
          }
          frag.appendChild(c);
        });
        t.parentNode.insertBefore(frag, t);
        listCache.set(key, sig);
      }
      t.parentNode.querySelectorAll(`button[data-clone="${key}"]`).forEach((b) => {
        const item = list[Number(b.dataset.index)]; if (item) b.setAttribute('aria-pressed', String(!!item.on));
      });
    });
  }

  function render() {
    const v = Object.assign({ sent: state.sent, notSent: !state.sent }, compute());
    renderLists(v);
    document.querySelectorAll('[data-bind]').forEach((el) => {
      if (el.closest('template') || el.closest('[data-clone]')) return;
      const k = el.dataset.bind; if (k in v) el.textContent = v[k];
    });
    document.querySelectorAll('[data-show]').forEach((el) => { el.hidden = !v[el.dataset.show]; });
    document.querySelectorAll('[data-pressed]').forEach((el) => el.setAttribute('aria-pressed', String(!!v[el.dataset.pressed])));
    document.querySelectorAll('[data-model]').forEach((el) => {
      if (el.closest('template')) return;
      const k = el.dataset.model; if (!(k in v)) return;
      if (document.activeElement !== el || el.tagName === 'SELECT') el.value = ((k === 'credit' || k === 'valor') && v[k] !== '') ? Number(v[k]).toLocaleString('pt-BR') : v[k];
    });
    document.querySelectorAll('[data-width]').forEach((el) => { const k = el.dataset.width; if (k in v) el.style.width = v[k]; });
    document.querySelectorAll('[data-attr-min],[data-attr-max],[data-attr-aria-label]').forEach((el) => {
      ['min', 'max', 'aria-label'].forEach((a) => {
        const k = el.getAttribute('data-attr-' + a); if (!k) return;
        const val = k.split('.').reduce((o, p) => (o ? o[p] : undefined), v);
        if (val !== undefined) el.setAttribute(a, val);
      });
    });
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]'); if (!el) return;
    const fn = actions[el.dataset.action]; if (fn) { e.preventDefault(); fn(e); }
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-change]'); if (!el) return;
    const fn = actions[el.dataset.change]; if (fn) fn(e);
  });

  /* ---------- Vídeo do topo ---------- */
  const video = document.querySelector('video[data-video]');
  if (video) {
    video.muted = true;
    if (reduceMotion) video.pause(); else { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
    actions.toggleVideo = () => {
      if (state.playing) video.pause(); else { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
      state.playing = !state.playing; render();
    };
  }
  const videoVals = () => ({ playing: state.playing, paused: !state.playing, videoLabel: state.playing ? 'Pausar vídeo' : 'Reproduzir vídeo' });

  /* ---------- Cálculos ---------- */
  const TAXA_ADM = 0.18, FUNDO = 0.02; // [premissas a validar com a AM]
  const bucket = (v) => v <= 100000 ? 'ate-100k' : v <= 300000 ? '100-300k' : v <= 600000 ? '300-600k' : v <= 1000000 ? '600k-1m' : 'mais-1m';
  const price = (credit, i, n) => credit > 0 && n > 0 ? credit * i / (1 - Math.pow(1 + i, -n)) : 0;
  const num = (x) => Math.max(0, Number(x) || 0);
  let leadPayload = () => ({});

  /* Simulador em duas etapas (página principal e páginas de produto) */
  if (page === 'home' || page === 'lance-imovel' || page === 'lance-auto') {
    const lancePage = page !== 'home';
    const cfgFor = (t) => t === 'imovel'
      ? { quickC: [200000, 400000, 600000, 1000000], quickP: [1500, 2500, 4000, 6000], prazos: [120, 150, 180, 200, 240], dflt: lancePage ? 500000 : 400000, dPrazo: 200, mes: 12 }
      : { quickC: [50000, 80000, 120000, 200000], quickP: [800, 1200, 1800, 2500], prazos: [48, 60, 72, 80, 100], dflt: 90000, dPrazo: 80, mes: 6 };
    Object.assign(state, { tipo: page === 'lance-auto' ? 'veiculo' : 'imovel', modo: 'credito', step: 1, lance: 25 });
    { const c = cfgFor(state.tipo); state.valor = c.dflt; state.prazo = c.dPrazo; }
    const FATOR = 1 + TAXA_ADM + FUNDO;
    const nums = () => {
      const valor = num(state.valor), prazo = state.prazo;
      const credit = state.modo === 'credito' ? valor : Math.round(valor * prazo / FATOR / 1000) * 1000;
      const parcela = state.modo === 'credito' ? (prazo ? credit * FATOR / prazo : 0) : valor;
      return { credit, parcela, prazo };
    };
    const setTipo = (t) => { const c = cfgFor(t); Object.assign(state, { tipo: t, modo: 'credito', valor: c.dflt, prazo: c.dPrazo }); render(); };
    const setModo = (m) => {
      if (state.modo === m) return;
      const n = nums();
      state.valor = m === 'credito' ? n.credit : Math.round(n.parcela / 10) * 10;
      state.modo = m; render();
    };
    actions.setImovel = () => setTipo('imovel');
    actions.setVeiculo = () => setTipo('veiculo');
    actions.modoCredito = () => setModo('credito');
    actions.modoParcela = () => setModo('parcela');
    actions.onValor = (e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 9); state.valor = d === '' ? '' : Number(d); e.target.value = d === '' ? '' : Number(d).toLocaleString('pt-BR'); render(); };
    actions.onPrazo = (e) => { state.prazo = Number(e.target.value); render(); };
    const panel = () => document.querySelector('#simular');
    actions.next = () => {
      if (num(state.valor) <= 0) { const el = panel().querySelector('[data-model=valor]'); if (el) el.focus(); return; }
      state.step = 2; render();
      const first = panel().querySelector('[data-show=step2] input'); if (first) setTimeout(() => first.focus({ preventScroll: true }), 350);
      if (lenis && innerWidth < 900) lenis.scrollTo(panel().querySelector('[data-show=step2]'), { offset: -90 });
    };
    actions.back = () => { state.step = 1; render(); };
    compute = () => {
      const c = cfgFor(state.tipo); const n = nums(); const prazo = n.prazo;
      const porCredito = state.modo === 'credito';
      const tipoNome = state.tipo === 'imovel' ? 'Imóvel' : 'Automóvel';
      const out = Object.assign(videoVals(), {
        valor: state.valor, prazo, porCredito, porParcela: !porCredito,
        isImovel: state.tipo === 'imovel', isVeiculo: state.tipo === 'veiculo',
        step1: state.step === 1, step2: state.step === 2,
        etapaTexto: `Etapa ${state.step} de 2`, etapaNome: state.step === 1 ? 'Sua simulação' : 'Seus dados', progress: state.step === 1 ? '50%' : '100%',
        valorLabel: porCredito ? (lancePage ? (state.tipo === 'imovel' ? 'Valor do imóvel' : 'Valor do carro') : 'Quanto você precisa?') : 'Quanto quer pagar por mês?',
        quick: (porCredito ? c.quickC : c.quickP).map((v) => ({ label: porCredito ? short(v) : money.format(v), on: v === num(state.valor), pick: () => { state.valor = v; render(); } })),
        prazos: c.prazos.map((m) => ({ value: m, label: m + ' meses' })),
        resultLabel: porCredito ? 'Sua parcela' : 'Crédito estimado',
        resultValor: porCredito ? money.format(n.parcela) : money.format(n.credit),
        resultSufixo: porCredito ? ' /mês' : '',
        resumoTitulo: `${tipoNome} · ${money.format(n.credit)}`,
        resumoDetalhe: `${prazo} meses · ${money.format(n.parcela)}/mês`,
        creditFmt: money.format(n.credit), consParcela: money.format(n.parcela),
      });
      if (lancePage) {
        const total = n.credit * FATOR;
        const restante = Math.max(0, total - n.parcela * c.mes);
        const lance = state.lance, valorLance = n.credit * lance / 100;
        const depois = Math.max(0, restante - valorLance) / Math.max(1, prazo - c.mes);
        Object.assign(out, {
          parcela: money.format(n.parcela), depois: money.format(lance ? depois : n.parcela),
          depoisLabel: lance ? 'Parcela depois do lance' : 'Parcela depois de contemplado',
          lanceFrase: lance
            ? `Com um lance de ${money.format(valorLance)} (${lance}% do crédito), a parcela cai para cerca de ${money.format(depois)} depois da contemplação.`
            : 'Sem lance, você concorre só no sorteio e mantém a mesma parcela até o fim.',
          lances: [0, 15, 25, 30].map((v) => ({ label: v ? v + '%' : 'Sem', on: v === lance, pick: () => { state.lance = v; render(); } })),
          resumoDetalhe: `${prazo} meses · ${money.format(n.parcela)}/mês${lance ? ` · lance de ${lance}%` : ''}`,
        });
      }
      return out;
    };
    leadPayload = () => {
      const v = compute(); const n = nums();
      const origem = page === 'home' ? 'Site · simulador da página principal' : page === 'lance-imovel' ? 'Site · página de imóvel' : 'Site · página de automóvel';
      return {
        interest: state.tipo === 'imovel' ? 'imovel' : 'carro', credit: bucket(n.credit), source: origem,
        monthlyBudget: state.modo === 'parcela' ? String(n.parcela) : '',
        note: `Simulação no site (${state.modo === 'credito' ? 'pelo valor do crédito' : 'pelo valor da parcela'}): ${state.tipo === 'imovel' ? 'imóvel' : 'automóvel'}, crédito de ${v.creditFmt} em ${n.prazo} meses, parcela estimada de ${v.consParcela}${lancePage ? `, lance de ${state.lance}%` : ''}.`,
      };
    };
  }

  if (page === 'empresas') {
    const stage = { 'Quero começar a vender consórcio': 'iniciar', 'Já vendo e quero melhorar': 'organizar', 'Estou formando uma equipe': 'desenvolver' };
    const team = { 'Só eu': '1', '2 a 5 pessoas': '2-5', '6 a 20 pessoas': '6-20', 'Mais de 20': 'mais-20' };
    leadPayload = (form) => ({
      interest: 'mentoria', company: form.elements.empresa.value.trim(),
      businessStage: stage[form.elements.momento.value] || 'iniciar', teamSize: team[form.elements.equipe.value] || 'definir',
      source: 'Site · página para empresas',
    });
  }

  /* ---------- Formulários de lead ---------- */
  const validCPF = (v) => {
    if (!/^\d{11}$/.test(v) || /^(\d)\1{10}$/.test(v)) return false;
    for (let n = 9; n <= 10; n++) {
      let sum = 0; for (let i = 0; i < n; i++) sum += Number(v[i]) * (n + 1 - i);
      const d = (sum * 10) % 11; if ((d === 10 ? 0 : d) !== Number(v[n])) return false;
    }
    return true;
  };
  document.querySelectorAll('input[name=cpf]').forEach((el) => el.addEventListener('input', () => {
    const d = el.value.replace(/\D/g, '').slice(0, 11);
    el.value = d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
  }));
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16; return (c === 'x' ? r : (r & 3) | 8).toString(16);
  }));

  document.querySelectorAll('form[data-submit]').forEach((form) => {
    const tel = form.querySelector('input[type=tel]');
    if (!form.elements.nome && tel) {
      const name = document.createElement('input');
      name.name = 'nome'; name.required = true; name.autocomplete = 'name'; name.maxLength = 100;
      name.placeholder = 'Seu nome e sobrenome'; name.setAttribute('aria-label', 'Seu nome e sobrenome');
      name.setAttribute('style', tel.getAttribute('style') || ''); name.style.flex = '1 1 100%';
      tel.parentNode.insertBefore(name, tel);
    }
    const submit = form.querySelector('[type=submit]');
    const legal = Array.from(form.querySelectorAll('p')).find((p) => /Política de Privacidade/i.test(p.textContent));
    const consent = document.createElement('label');
    consent.className = 'consent';
    consent.innerHTML = '<input type="checkbox" name="consent" required><span>Li a <a href="politica-de-privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a> e autorizo a AM a me contatar sobre este atendimento.</span>';
    consent.style.flex = '1 1 100%'; consent.style.gridColumn = '1 / -1';
    if (legal) legal.replaceWith(consent); else if (submit && submit.parentNode === form) form.insertBefore(consent, submit); else form.appendChild(consent);
    const hp = document.createElement('label'); hp.className = 'hp'; hp.setAttribute('aria-hidden', 'true');
    hp.innerHTML = 'Site<input name="website" tabindex="-1" autocomplete="off">'; form.appendChild(hp);
    const err = document.createElement('p'); err.className = 'form-error'; err.setAttribute('role', 'alert'); err.hidden = true;
    err.style.flex = '1 1 100%'; err.style.gridColumn = '1 / -1'; form.appendChild(err);
    let requestId = uuid();

    form.addEventListener('submit', async (e) => {
      e.preventDefault(); err.hidden = true;
      const nome = form.elements.nome.value.trim();
      const phone = (tel ? tel.value : '').replace(/\D/g, '');
      const fail = (m, el) => { err.textContent = m; err.hidden = false; if (el) el.focus(); };
      if (nome.length < 3 || !nome.includes(' ')) return fail('Informe seu nome e sobrenome.', form.elements.nome);
      const cpfEl = form.elements.cpf; const cpf = cpfEl ? cpfEl.value.replace(/\D/g, '') : '';
      if (cpf && !validCPF(cpf)) return fail('Confira o CPF ou deixe o campo em branco.', cpfEl);
      if (!/^[1-9]\d{9,10}$/.test(phone)) return fail('Informe um WhatsApp com DDD.', tel);
      if (!form.elements.consent.checked) return fail('Confirme a autorização para a AM entrar em contato.', form.elements.consent);
      const payload = Object.assign({ requestId, name: nome, phone, cpf, consent: true, consentVersion: CONSENT_VERSION, website: form.elements.website.value }, leadPayload(form));
      if (submit) submit.disabled = true;
      try {
        const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          const fields = body.fields ? Object.values(body.fields).join(' ') : '';
          throw new Error(fields || body.error || 'Não foi possível enviar agora. Fale com a AM pelo WhatsApp.');
        }
        state.sent = true; requestId = uuid(); render();
      } catch (ex) {
        fail(ex.message || 'Não foi possível enviar agora. Fale com a AM pelo WhatsApp.');
      } finally { if (submit) submit.disabled = false; }
    });
  });

  /* ---------- Máscara de WhatsApp ---------- */
  document.querySelectorAll('input[type=tel]').forEach((el) => {
    el.addEventListener('input', () => {
      const d = el.value.replace(/\D/g, '').slice(0, 11);
      let out = d;
      if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 6) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      el.value = out;
    });
  });

  /* ---------- Rolagem suave (Lenis) ---------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ autoRaf: true, lerp: 0.085, smoothWheel: true, syncTouch: false, anchors: false });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -12, duration: 1.4 });
      history.replaceState(null, '', a.getAttribute('href'));
    });
  }

  /* ---------- Barra de rolagem que some quando a página para ---------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    const rail = document.createElement('div'); rail.className = 'sb-rail'; rail.setAttribute('aria-hidden', 'true');
    const thumb = document.createElement('div'); thumb.className = 'sb-thumb'; rail.appendChild(thumb);
    document.body.appendChild(rail);
    document.documentElement.classList.add('has-sb');
    let hideTimer = 0, dragging = false, startY = 0, startScroll = 0, thumbH = 40, maxScroll = 0, track = 0;
    const metrics = () => {
      const doc = document.documentElement;
      maxScroll = Math.max(0, doc.scrollHeight - innerHeight);
      track = rail.clientHeight;
      thumbH = Math.max(40, track * innerHeight / Math.max(doc.scrollHeight, 1));
      thumb.style.height = thumbH + 'px';
    };
    const place = () => {
      const y = lenis ? lenis.scroll : scrollY;
      thumb.style.transform = `translateY(${maxScroll ? (y / maxScroll) * (track - thumbH) : 0}px)`;
    };
    const show = () => {
      if (!maxScroll) return;
      rail.classList.add('is-on'); clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { if (!dragging && !rail.matches(':hover')) rail.classList.remove('is-on'); }, 900);
    };
    const onScroll = () => { place(); show(); };
    if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => { metrics(); place(); });
    addEventListener('load', () => { metrics(); place(); });
    if ('ResizeObserver' in window) new ResizeObserver(() => { metrics(); place(); }).observe(document.body);
    document.addEventListener('mousemove', (e) => { if (innerWidth - e.clientX < 28) show(); }, { passive: true });
    rail.addEventListener('mouseleave', show);
    const scrollToY = (y) => { y = Math.max(0, Math.min(maxScroll, y)); if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); };
    thumb.addEventListener('pointerdown', (e) => {
      e.preventDefault(); dragging = true; rail.classList.add('is-drag'); thumb.setPointerCapture(e.pointerId);
      startY = e.clientY; startScroll = lenis ? lenis.scroll : scrollY;
    });
    thumb.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      scrollToY(startScroll + (e.clientY - startY) / Math.max(1, track - thumbH) * maxScroll);
    });
    const endDrag = () => { dragging = false; rail.classList.remove('is-drag'); show(); };
    thumb.addEventListener('pointerup', endDrag); thumb.addEventListener('pointercancel', endDrag);
    rail.addEventListener('pointerdown', (e) => {
      if (e.target !== rail) return;
      const r = rail.getBoundingClientRect();
      const y = Math.max(0, Math.min(maxScroll, (e.clientY - r.top - thumbH / 2) / Math.max(1, track - thumbH) * maxScroll));
      if (lenis) lenis.scrollTo(y, { duration: 0.8 }); else scrollTo({ top: y, behavior: 'smooth' });
    });
    metrics(); place();
  }

  /* ---------- Conteúdo surgindo suavemente ---------- */
  if (document.documentElement.classList.contains('js-anim') && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    const mark = (el, i) => {
      if (!el || el.classList.contains('rv') || el.tagName === 'TEMPLATE' || el.tagName === 'IMG' || el.hasAttribute('data-show') || el.getAttribute('aria-hidden') === 'true' && !el.hasAttribute('data-type')) return;
      el.classList.add('rv');
      el.style.setProperty('--d', Math.min(i, 6) * 90 + 'ms');
      io.observe(el);
    };
    const sameKind = (el) => el.children.length >= 3 && Array.from(el.children).every((c) => c.tagName === el.children[0].tagName);
    document.querySelectorAll('.v2 > section, .v2 > footer').forEach((sec, sIdx) => {
      const boxes = sec.querySelectorAll(':scope > div[style*="max-width"]');
      boxes.forEach((box) => {
        let i = 0;
        Array.from(box.children).forEach((child) => {
          if (sameKind(child)) Array.from(child.children).forEach((c) => mark(c, i++));
          else if (child.children.length === 2 && child.tagName === 'DIV' && sIdx > 0) Array.from(child.children).forEach((c) => mark(c, i++));
          else mark(child, i++);
        });
      });
    });
  }

  /* ---------- Digitação do nome no rodapé ---------- */
  document.querySelectorAll('[data-type]').forEach((el) => {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    const text = el.textContent.trim();
    el.textContent = '';
    const chars = Array.from(text).map((ch) => {
      const s = document.createElement('span'); s.className = 'type-char'; s.textContent = ch === ' ' ? ' ' : ch; el.appendChild(s); return s;
    });
    const caret = document.createElement('span'); caret.className = 'type-caret'; el.insertBefore(caret, el.firstChild);
    const obs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      chars.forEach((s, i) => setTimeout(() => {
        s.classList.add('on'); s.after(caret);
        if (i === chars.length - 1) caret.classList.add('done');
      }, 250 + i * 95));
    }, { threshold: 0.5 });
    obs.observe(el);
  });

  /* Links ainda sem endereço definido (redes sociais) */
  document.querySelectorAll('a[data-pending]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  render();
})();
