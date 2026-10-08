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
      if (document.activeElement !== el || el.tagName === 'SELECT') el.value = v[k];
    });
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

  if (page === 'home') {
    const cfgFor = (t) => t === 'imovel'
      ? { min: 50000, max: 2000000, quick: [200000, 400000, 600000, 1000000], prazos: [120, 150, 180, 200, 240], dflt: 400000, dPrazo: 200, i: Math.pow(1.115, 1 / 12) - 1 }
      : { min: 30000, max: 400000, quick: [50000, 80000, 120000, 200000], prazos: [48, 60, 72, 80, 100], dflt: 80000, dPrazo: 80, i: 0.0179 };
    Object.assign(state, { tipo: 'imovel', credit: 400000, prazo: 200 });
    const setTipo = (t) => { const c = cfgFor(t); Object.assign(state, { tipo: t, credit: c.dflt, prazo: c.dPrazo }); render(); };
    actions.setImovel = () => setTipo('imovel');
    actions.setVeiculo = () => setTipo('veiculo');
    actions.onCredit = (e) => { state.credit = e.target.value === '' ? '' : Number(e.target.value); render(); };
    actions.onPrazo = (e) => { state.prazo = Number(e.target.value); render(); };
    compute = () => {
      const c = cfgFor(state.tipo); const credit = num(state.credit); const prazo = state.prazo;
      const adm = credit * TAXA_ADM, fundo = credit * FUNDO, total = credit + adm + fundo;
      const fin = price(credit, c.i, prazo);
      return Object.assign(videoVals(), {
        cfg: { min: c.min, max: c.max }, credit: state.credit, prazo,
        isImovel: state.tipo === 'imovel', isVeiculo: state.tipo === 'veiculo',
        quick: c.quick.map((v) => ({ label: short(v), on: v === credit, pick: () => { state.credit = v; render(); } })),
        prazos: c.prazos.map((m) => ({ value: m, label: m + ' meses' })),
        creditFmt: money.format(credit), taxaAdm: money.format(adm), fundo: money.format(fundo),
        consTotal: money.format(total), consParcela: money.format(prazo ? total / prazo : 0),
        finParcela: money.format(fin), finTotal: money.format(fin * prazo),
      });
    };
    leadPayload = () => {
      const v = compute(); const credit = num(state.credit);
      return { interest: state.tipo === 'imovel' ? 'imovel' : 'carro', credit: bucket(credit), source: 'Site · simulador da página principal',
        note: `Simulação no site: ${state.tipo === 'imovel' ? 'imóvel' : 'automóvel'} de ${v.creditFmt} em ${state.prazo} meses, parcela estimada de ${v.consParcela}.` };
    };
  }

  if (page === 'lance-imovel' || page === 'lance-auto') {
    const imovel = page === 'lance-imovel';
    const prazos = imovel ? [120, 150, 180, 200, 240] : [48, 60, 72, 80, 100];
    const mesContemplacao = imovel ? 12 : 6;
    Object.assign(state, { credit: imovel ? 500000 : 90000, prazo: imovel ? 200 : 80, lance: 25 });
    actions.onCredit = (e) => { state.credit = e.target.value === '' ? '' : Number(e.target.value); render(); };
    actions.onPrazo = (e) => { state.prazo = Number(e.target.value); render(); };
    compute = () => {
      const credit = num(state.credit); const { prazo, lance } = state;
      const adm = credit * TAXA_ADM, fundo = credit * FUNDO, total = credit + adm + fundo;
      const parcela = prazo ? total / prazo : 0;
      const restante = Math.max(0, total - parcela * mesContemplacao);
      const valorLance = credit * lance / 100;
      const depois = Math.max(0, restante - valorLance) / Math.max(1, prazo - mesContemplacao);
      return {
        credit: state.credit, prazo, creditFmt: money.format(credit),
        taxaAdm: money.format(adm), fundo: money.format(fundo), consTotal: money.format(total),
        parcela: money.format(parcela), depois: money.format(lance ? depois : parcela),
        depoisLabel: lance ? 'Parcela depois do lance' : 'Parcela depois de contemplado',
        lanceFrase: lance
          ? `Com um lance de ${money.format(valorLance)} (${lance}% do crédito), a parcela cai de ${money.format(parcela)} para cerca de ${money.format(depois)} depois da contemplação.`
          : 'Sem lance, você concorre só no sorteio e mantém a mesma parcela até o fim.',
        prazos: prazos.map((m) => ({ value: m, label: m + ' meses' })),
        lances: [0, 15, 25, 30].map((v) => ({ label: v ? v + '%' : 'Sem', on: v === lance, pick: () => { state.lance = v; render(); } })),
      };
    };
    leadPayload = () => {
      const v = compute();
      return { interest: imovel ? 'imovel' : 'carro', credit: bucket(num(state.credit)), source: imovel ? 'Site · página de imóvel' : 'Site · página de automóvel',
        note: `Simulação no site: crédito de ${v.creditFmt} em ${state.prazo} meses, lance de ${state.lance}%. Parcela ${v.parcela}; depois do lance, cerca de ${v.depois}.` };
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
      if (!/^[1-9]\d{9,10}$/.test(phone)) return fail('Informe um WhatsApp com DDD.', tel);
      if (!form.elements.consent.checked) return fail('Confirme a autorização para a AM entrar em contato.', form.elements.consent);
      const payload = Object.assign({ requestId, name: nome, phone, consent: true, consentVersion: CONSENT_VERSION, website: form.elements.website.value }, leadPayload(form));
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

  /* Links ainda sem endereço definido (redes sociais) */
  document.querySelectorAll('a[data-pending]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  render();
})();
