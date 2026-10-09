/* Simulador AM — interface. Depende de calc.js (window.AMCalc). */
(function () {
  'use strict';
  var A = window.AMCalc, B = A.BASES;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Formatação ---------- */
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var brl0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  var num = new Intl.NumberFormat('pt-BR');
  var R = function (v) { return brl.format(v || 0); };
  var R0 = function (v) { return brl0.format(Math.round(v || 0)); };
  var P = function (v, d) { return (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }) + '%'; };
  var compact = function (v) {
    var a = Math.abs(v), s = v < 0 ? '−' : '';
    if (a >= 1e6) return s + 'R$ ' + (a / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
    if (a >= 1e3) return s + 'R$ ' + Math.round(a / 1e3) + ' mil';
    return s + 'R$ ' + Math.round(a);
  };
  var signed = function (v) { return (v >= 0 ? '+' : '−') + R0(Math.abs(v)).replace('R$', 'R$'); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var parseNum = function (s) { s = String(s || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.\-]/g, ''); var v = parseFloat(s); return isFinite(v) ? v : 0; };
  var mesAno = function (t) { var a = Math.ceil(t / 12); return 'mês ' + t + ' · ' + a + 'º ano'; };

  /* ---------- Objetivos ---------- */
  var OBJ = {
    imovel: { base: 'santander', nome: 'Consórcio de imóvel', credito: 300000, prazo: 240, grupo: '3216', chips: [120000, 200000, 300000, 500000],
      finTaxa: 11.5, finUnidade: 'aa', finPrazo: 240, sistema: 'sac', bem: 'o imóvel' },
    automovel: { base: 'servopa', nome: 'Consórcio de automóvel', credito: 100000, prazo: 100, grupo: '', chips: [60000, 80000, 100000, 150000],
      finTaxa: 1.79, finUnidade: 'am', finPrazo: 60, sistema: 'price', bem: 'o carro', aviso: 'Prazo de automóvel a confirmar na tabela Servopa. As demais premissas vêm da planilha "Plano de investimento v6".' },
    investimento: { base: 'servopa', nome: 'Consórcio como investimento', credito: 100000, prazo: 240, grupo: '', chips: [100000, 200000, 300000, 500000],
      finTaxa: 11.5, finUnidade: 'aa', finPrazo: 240, sistema: 'sac', bem: 'o bem' }
  };
  var PREM = ['taxaAdm', 'fundoReserva', 'reducao', 'reducaoAte', 'reajusteTaxa', 'reajustePeriodo', 'reducaoBase', 'lanceBase', 'venda', 'aplicacao'];

  var S = {};
  function reset(obj, keep) {
    var o = OBJ[obj], b = B[o.base];
    var cliente = keep ? S.cliente : '';
    S = { obj: obj, cliente: cliente, credito: o.credito, prazo: o.prazo, grupo: o.grupo, mes: 12, lanceTipo: 'nenhum', lancePct: b.lancePct,
      abatimento: 'parcela', embutido: true, finTaxa: o.finTaxa, finPrazo: o.finPrazo, sistema: o.sistema, tab: S.tab || 'evolucao',
      hidden: {} };
    PREM.forEach(function (k) { S[k] = b[k]; });
    if (o.grupo) applyGrupo(o.grupo);
  }
  function applyGrupo(id) {
    var g = B.santander.grupos.filter(function (x) { return x.id === id; })[0];
    S.grupo = id; if (g) S.taxaAdm = g.taxaAdm;
  }
  function base() { return B[OBJ[S.obj].base]; }
  function grupoInfo() { return B.santander.grupos.filter(function (x) { return x.id === S.grupo; })[0]; }
  function params(extra) {
    var p = { credito: S.credito, prazo: S.prazo, contemplacao: 0, lanceTipo: S.lanceTipo, lancePct: S.lanceTipo === 'nenhum' ? 0 : S.lancePct,
      embutido: S.embutido, abatimento: S.abatimento };
    PREM.forEach(function (k) { p[k] = S[k]; });
    p.reajustePeriodo = +S.reajustePeriodo;
    return Object.assign(p, extra || {});
  }

  /* ---------- Estado na URL (para reabrir uma simulação) ---------- */
  var KEYS = ['obj', 'credito', 'prazo', 'grupo', 'mes', 'lanceTipo', 'lancePct', 'abatimento', 'embutido', 'finTaxa', 'finPrazo', 'sistema', 'tab'].concat(PREM);
  function saveHash() {
    var q = new URLSearchParams();
    KEYS.forEach(function (k) { q.set(k, S[k]); });
    history.replaceState(null, '', '#' + q.toString());
  }
  function loadHash() {
    var h = location.hash.slice(1); if (!h) return false;
    var q = new URLSearchParams(h); var obj = q.get('obj'); if (!OBJ[obj]) return false;
    reset(obj);
    KEYS.forEach(function (k) {
      if (!q.has(k) || k === 'obj') return; var v = q.get(k);
      if (k === 'embutido') S[k] = v === 'true';
      else if (/^(grupo|lanceTipo|abatimento|sistema|tab|reducaoBase|lanceBase)$/.test(k)) S[k] = v;
      else if (isFinite(+v)) S[k] = +v;
    });
    return true;
  }

  /* ---------- Gráfico de linhas em SVG ---------- */
  function niceMax(v) { if (v <= 0) return 1; var e = Math.pow(10, Math.floor(Math.log10(v))), m = v / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e; }
  function lineChart(el, cfg) {
    var W = Math.max(300, Math.round(el.clientWidth || 800)), H = cfg.height || Math.round(Math.min(360, Math.max(220, W * 0.38)));
    var padL = 64, padR = 16, padT = 28, padB = 28, n = cfg.n;
    var vis = cfg.series.filter(function (s) { return !s.hidden; });
    var max = 0, min = 0, capMax = 0, capped = null;
    vis.forEach(function (s) { s.values.forEach(function (v) { if (s.cap) { if (v > capMax) capMax = v; return; } if (v > max) max = v; if (v < min) min = v; }); });
    if (capMax > max * 1.6 && max > 0) capped = vis.filter(function (s) { return s.cap; })[0]; else if (capMax > max) max = capMax;
    var stepY = niceMax((max - min) / 4 || 1);
    max = Math.ceil(max * 1.02 / stepY) * stepY; min = min < 0 ? Math.floor(min / stepY) * stepY : 0;
    if (max <= min) max = min + stepY;
    var x = function (t) { return padL + (t - 1) / Math.max(1, n - 1) * (W - padL - padR); };
    var y = function (v) { return padT + (max - v) / (max - min || 1) * (H - padT - padB); };
    var yc = function (v) { return Math.max(padT, Math.min(H - padB, y(v))); };
    var cid = 'clip' + Math.random().toString(36).slice(2, 8);
    var g = [];
    for (var v = min; v <= max + stepY / 2; v += stepY) {
      var yy = y(v).toFixed(1);
      g.push('<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + yy + '" y2="' + yy + '"' + (Math.abs(v) < 1e-9 && min < 0 ? ' stroke="#CFC8BA"' : '') + '/>');
      g.push('<text x="' + (padL - 8) + '" y="' + (+yy + 4) + '" text-anchor="end">' + compact(v) + '</text>');
    }
    var plotW = W - padL - padR, step = 6;
    [6, 12, 24, 36, 60, 120].some(function (st) { step = st; return plotW / (n / st) >= 58; });
    var xl = [];
    for (var t = step; t <= n; t += step) xl.push('<text x="' + x(t).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + (step >= 12 ? (t / 12) + 'º ano' : 'mês ' + t) + '</text>');
    var bands = (cfg.bands || []).map(function (b) { return '<rect x="' + x(b.from).toFixed(1) + '" y="' + padT + '" width="' + Math.max(0, x(b.to) - x(b.from)).toFixed(1) + '" height="' + (H - padT - padB) + '" fill="' + b.fill + '"/>'; }).join('');
    var lines = vis.map(function (s) {
      var d = s.values.map(function (v, k) { return (k ? 'L' : 'M') + x(k + 1).toFixed(1) + ' ' + y(v).toFixed(1); }).join('');
      return '<path class="ln' + (cfg.animate && !s.dash ? ' ln-draw' : '') + '" d="' + d + '" stroke="' + s.color + '"' + (s.dash ? ' stroke-dasharray="6 5"' : '') + ' clip-path="url(#' + cid + ')"/>';
    }).join('');
    var c = cfg.cursor ? Math.min(n, Math.max(1, cfg.cursor)) : 0, cur = '';
    if (c) {
      cur = '<g class="cursor"><line x1="' + x(c).toFixed(1) + '" x2="' + x(c).toFixed(1) + '" y1="' + padT + '" y2="' + (H - padB) + '"/>' +
        vis.map(function (s) { return '<circle cx="' + x(c).toFixed(1) + '" cy="' + yc(s.values[c - 1]).toFixed(1) + '" r="5" fill="' + s.color + '"/>'; }).join('') + '</g>';
    }
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(cfg.label || 'Gráfico') + '"><defs><clipPath id="' + cid + '"><rect x="' + padL + '" y="' + (padT - 3) + '" width="' + plotW + '" height="' + (H - padT - padB + 6) + '"/></clipPath></defs>' + bands +
 '<g class="grid axis">' + g.join('') + xl.join('') + '</g>' + lines + cur + '</svg>' +
      (c ? '<span class="tip">' + mesAno(c) + '</span>' : '') +
      (capped ? '<p class="cap-note">A linha tracejada passa do topo do gráfico: ' + esc(capped.capLabel || '') + ' chega a ' + compact(capMax) + ' no fim do plano.</p>' : '');
    var tip = el.querySelector('.tip'); if (tip) { tip.style.left = (x(c) / W * 100) + '%'; tip.style.top = '-4px'; }
    if (cfg.animate) $$('.ln-draw', el).forEach(function (p) { var L = p.getTotalLength ? p.getTotalLength() : 2000; p.style.setProperty('--len', Math.ceil(L)); });
    el._x = function (clientX) { var r = el.getBoundingClientRect(); var px = (clientX - r.left) / r.width * W; return Math.round((px - padL) / (W - padL - padR) * (n - 1) + 1); };
  }

  /* ---------- Cálculos derivados ---------- */
  var cache = {};
  function compute() {
    var p = params();
    var r0 = A.simular(Object.assign({}, p, { lancePct: S.lanceTipo === 'fixo' ? S.lancePct : base().lancePct })); // sem contemplação: caminho da cota no tempo
    var rt = A.simular(params({ contemplacao: S.mes }));          // contemplada no mês escolhido
    var serie = r0.meses.map(function (l, k) {
      var iv = r0.investimento[k], saldo = Math.max(0, r0.totalPct - l.pagoPct) / 100 * l.credito;
      return { t: l.t, pago: l.pago, venda: iv.venda, vendaEmb: iv.vendaEmb, lucroEmb: iv.lucroEmb, aplic: l.aplicacao, credito: l.credito, saldo: saldo, patr: l.credito - saldo, parcela: l.parcela, fase: iv.estrategia };
    });
    cache = { p: p, r0: r0, rt: rt, serie: serie };
    return cache;
  }

  /* ---------- Renderização ---------- */
  var animateNext = true;
  function render() {
    var c = compute(), o = OBJ[S.obj], b = base(), r0 = c.r0, rt = c.rt, n = S.prazo;
    var g = grupoInfo(), isSant = o.base === 'santander';
    document.body.dataset.obj = S.obj;

    // painel
    $$('[data-obj]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.obj === S.obj); });
    $$('[data-lance]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.lance === S.lanceTipo); });
    $$('[data-sis]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.sis === S.sistema); });
    $('#lance-opts').hidden = S.lanceTipo === 'nenhum';
    $('#grupo-wrap').hidden = !isSant;
    $('#chips').innerHTML = o.chips.map(function (v) { return '<button type="button" data-chip="' + v + '" aria-pressed="' + (v === S.credito) + '">' + compact(v).replace('R$ ', 'R$ ') + '</button>'; }).join('');
    $('#fonte').textContent = b.fonte + (o.aviso ? ' ' + o.aviso : '');
    $('#finTaxa-label').textContent = 'Financiamento (% ' + (o.finUnidade === 'aa' ? 'a.a.' : 'a.m.') + ')';
    ['mes', 'scrub'].forEach(function (id) { var el = $('#' + id); el.max = n; el.value = Math.min(S.mes, n); el.style.setProperty('--p', ((Math.min(S.mes, n) - 1) / Math.max(1, n - 1) * 100) + '%'); });
    $('#mes-out').textContent = S.mes;
    $('#scrub-out').textContent = mesAno(S.mes);
    syncInputs();

    // destaque
    var reduzida = r0.primeiraParcela, temRed = S.reducao > 0;
    $('#hero-eyebrow').textContent = o.nome + ' · ' + b.administradora.replace('Consórcio ', '') + (isSant && g ? ' · Grupo ' + g.id : '');
    heroTitle(R(reduzida));
    var sub;
    if (!temRed) sub = 'Parcela integral, sem juros e sem entrada.';
    else if (S.reducaoAte) sub = 'Parcela reduzida em ' + P(S.reducao, 0) + (S.reducaoBase === 'fc' ? ' do fundo comum' : '') + ' até a ' + S.reducaoAte + 'ª assembleia ou a contemplação.';
    else sub = 'Parcela flex com ' + P(S.reducao, 0) + ' de redução até a contemplação.';
    if (isSant && g) sub += ' Vencimento todo dia ' + g.vencimento + '.';
    $('#hero-sub').textContent = sub;
    $('#kpi-credito').textContent = R0(S.credito);
    var depois = r0.aposReducao;
    if (temRed && S.reducaoAte && depois) { $('#kpi-depois-label').textContent = 'A partir do mês ' + depois.t; $('#kpi-depois').textContent = R(depois.parcela); }
    else { $('#kpi-depois-label').textContent = 'Parcela integral hoje'; $('#kpi-depois').textContent = R(r0.parcelaIntegralHoje); }
    $('#kpi-taxa').textContent = P(r0.taxaMensal, 3) + ' ao mês';
    $('#kpi-plano').textContent = P(S.taxaAdm + S.fundoReserva); $('#kpi-plano-label').textContent = 'Taxa total em ' + n + ' meses';

    renderEvolucao(c);
    renderContemplacao(c);
    renderComparativo(c);
    renderTabela(c);
    $('#disclaimer').textContent = 'Simulação ilustrativa, não é proposta. ' + b.razao + '. ' + b.fonte +
      ' Reajuste estimado de ' + P(S.reajusteTaxa) + ' ' + (+S.reajustePeriodo === 6 ? 'por semestre' : 'por ano') + ' (' + b.reajusteIndice + '); o índice real do grupo pode variar. ' +
      'Contemplação por sorteio ou lance, sem data garantida. Valor de venda da carta estimado em ' + P(S.venda, 0) + ' do crédito; depende do mercado e da aprovação da administradora. ' +
      'Aplicação considerada a ' + P(S.aplicacao) + ' ao mês. Não inclui seguros. Sujeito à análise de crédito na contemplação e às regras do contrato.';
    saveHash();
    animateNext = false;
  }

  var COLORS = { venda: '#D4AF37', pago: '#111111', aplic: '#9A958C', patr: '#2F6B4F' };
  var PRINT = { venda: '#B8901F', pago: '#111111', aplic: '#8A857C', patr: '#2F6B4F' };
  var LABELS = { venda: 'Valor de venda da carta', patr: 'Patrimônio na cota', pago: 'Total pago', aplic: 'Mesmo valor aplicado' };
  var PH = { financeira: ['ph-financeira', 'Venda supera o pago', 'rgba(212,175,55,.08)'], patrimonial: ['ph-patrimonial', 'Usar ou manter', 'rgba(47,107,79,.06)'], previdenciaria: ['ph-previdenciaria', 'Reta final', 'rgba(77,69,102,.07)'] };

  function phases(serie) {
    var out = [], cur = null;
    serie.forEach(function (s) { if (!cur || cur.fase !== s.fase) { cur = { fase: s.fase, from: s.t, to: s.t }; out.push(cur); } else cur.to = s.t; });
    // trechos de poucos meses (oscilação no reajuste) entram no trecho anterior
    var merged = [];
    out.forEach(function (o) { var last = merged[merged.length - 1]; if (last && (o.to - o.from < 6 && o.fase !== 'previdenciaria')) last.to = o.to; else if (last && last.fase === o.fase) last.to = o.to; else merged.push(o); });
    return merged;
  }

  function renderEvolucao(c) {
    var sr = c.serie, n = S.prazo, t = Math.min(S.mes, n), at = sr[t - 1];
    $('#legend-evo').innerHTML = ['venda', 'patr', 'pago', 'aplic'].map(function (k) {
      return '<button type="button" class="lg" data-serie="' + k + '" aria-pressed="' + !S.hidden[k] + '"><i' + (k === 'aplic' ? ' class="dash"' : '') + '></i>' + LABELS[k] + '</button>';
    }).join('');
    $$('#legend-evo i').forEach(function (i, k) { i.style.background = COLORS[['venda', 'patr', 'pago', 'aplic'][k]]; });
    var ph = phases(sr);
    lineChart($('#chart-evo'), {
      n: n, cursor: t, animate: animateNext, label: 'Evolução da cota ao longo do plano',
      bands: ph.map(function (p) { return { from: p.from, to: p.to, fill: PH[p.fase][2] }; }),
      series: ['venda', 'patr', 'pago', 'aplic'].map(function (k) { return { key: k, color: COLORS[k], dash: k === 'aplic', cap: k === 'aplic', capLabel: 'Aplicação', hidden: !!S.hidden[k], values: sr.map(function (s) { return s[k]; }) }; })
    });
    $('#phases').innerHTML = ph.map(function (p) { var w = (p.to - p.from + 1) / n; return '<div class="' + PH[p.fase][0] + '" title="' + PH[p.fase][1] + ' · meses ' + p.from + ' a ' + p.to + '">' + (w > 0.09 ? PH[p.fase][1] : '') + '</div>'; }).join('');
    $$('#phases div').forEach(function (d, k) { d.style.flex = (ph[k].to - ph[k].from + 1) + ' 1 0'; });

    // Três caminhos no mês t
    var rt = c.rt, L = rt.lance || {}, desemb = L.desembolso || 0;
    var o = OBJ[S.obj], goal = S.obj !== 'investimento';
    var vendaGanho = at.venda - at.pago, aplicGanho = at.aplic - at.pago;
    var vendaVsAplic = at.venda - at.aplic, patrVsAplic = at.patr - at.aplic;
    var best = null;
    if (at.venda >= at.patr && vendaVsAplic > 0) best = 'vender';
    else if (at.patr > at.venda && patrVsAplic > 0) best = 'manter';
    var mudaParcela = at.parcela ? (L.parcelaDepois / at.parcela - 1) : 0;
    var ic = {
      usar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
      vender: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17 10 11l4 4 6-7"/><path d="M15 8h5v5"/></svg>',
      manter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M7 8l5-5 5 5"/><rect x="4" y="15" width="16" height="6" rx="1"/></svg>'
    };
    var cards = [];
    cards.push('<article class="strat' + (goal ? ' goal' : '') + '">' + (goal ? '<span class="badge goal">Objetivo do cliente</span>' : '') +
      '<h3>' + ic.usar + 'Usar o crédito</h3><div class="big">' + R0(L.creditoLiberado) + '</div><p class="cap">para comprar ' + o.bem + (L.embutido && L.valor ? ', já descontado o lance embutido' : '') + '</p>' +
      '<dl><div><dt>Pago até aqui</dt><dd>' + R0(at.pago) + '</dd></div>' +
      (L.valor ? '<div><dt>Lance (' + P(L.pct / (S.lanceBase === 'plano' ? (100 + S.taxaAdm + S.fundoReserva) / 100 : 1), 0) + ')</dt><dd>' + R0(L.valor) + (L.embutido ? ' embutido' : ' do bolso') + '</dd></div>' : '') +
      '<div><dt>Parcela depois</dt><dd>' + (L.mesesRestantes ? R(L.parcelaDepois) : 'quitado') + '</dd></div>' +
      '<div><dt>Restam</dt><dd>' + (L.mesesRestantes || 0) + ' meses</dd></div>' +
      '<div><dt>Total pago no plano</dt><dd>' + R0(rt.totalPago + desemb) + '</dd></div></dl>' +
      (L.saldoNoCredito ? '<p class="verdict neg">Sem meses para diluir a redução: ' + R0(L.saldoNoCredito) + ' saem do crédito.</p>'
        : '<p class="verdict">' + (L.mesesRestantes ? 'A parcela ' + (mudaParcela > 0.005 ? 'sobe ' + P(mudaParcela * 100, 0) : mudaParcela < -0.005 ? 'cai ' + P(-mudaParcela * 100, 0) : 'se mantém') + ' depois da contemplação.' : 'Plano quitado na contemplação.') + '</p>') +
      '</article>');
    cards.push('<article class="strat' + (best === 'vender' ? ' best' : '') + '">' + (best === 'vender' ? '<span class="badge">Melhor neste momento</span>' : '') +
      '<h3>' + ic.vender + 'Vender a carta</h3><div class="big">' + R0(at.venda) + '</div><p class="cap">valor estimado de venda (' + P(S.venda, 0) + ' do crédito)</p>' +
      '<dl><div><dt>Pago até aqui</dt><dd>' + R0(at.pago) + '</dd></div>' +
      '<div><dt>Resultado</dt><dd class="' + (vendaGanho >= 0 ? 'pos' : 'neg') + '">' + signed(vendaGanho) + '</dd></div>' +
      '<div><dt>Rentabilidade</dt><dd class="' + (vendaGanho >= 0 ? 'pos' : 'neg') + '">' + (at.pago ? P(vendaGanho / at.pago * 100, 0) : '—') + '</dd></div>' +
      '<div><dt>Com lance fixo embutido (' + P(S.lanceTipo === 'fixo' ? S.lancePct : base().lancePct, 0) + ')</dt><dd class="' + (at.lucroEmb >= 0 ? 'pos' : 'neg') + '">' + signed(at.lucroEmb) + '</dd></div>' +
      '<div><dt>Mesmo valor aplicado</dt><dd>' + R0(at.aplic) + '</dd></div></dl>' +
      '<p class="verdict ' + (vendaVsAplic >= 0 ? 'pos' : 'neg') + '">' + (vendaVsAplic >= 0 ? 'Vender rende ' + R0(vendaVsAplic) + ' a mais que a aplicação.' : 'A aplicação estaria ' + R0(-vendaVsAplic) + ' à frente da venda.') + '</p></article>');
    cards.push('<article class="strat' + (best === 'manter' ? ' best' : '') + '">' + (best === 'manter' ? '<span class="badge">Melhor neste momento</span>' : '') +
      '<h3>' + ic.manter + 'Manter como investimento</h3><div class="big ' + (at.patr < 0 ? 'neg' : '') + '">' + (at.patr < 0 ? '−' : '') + R0(Math.abs(at.patr)) + '</div><p class="cap">patrimônio na cota: crédito menos o saldo a pagar</p>' +
      '<dl><div><dt>Crédito atualizado</dt><dd>' + R0(at.credito) + '</dd></div>' +
      '<div><dt>Saldo a pagar</dt><dd>' + R0(at.saldo) + '</dd></div>' +
      '<div><dt>Pago até aqui</dt><dd>' + R0(at.pago) + '</dd></div>' +
      '<div><dt>Crédito no fim do plano</dt><dd>' + R0(c.r0.creditoFinal) + '</dd></div></dl>' +
      '<p class="verdict ' + (patrVsAplic >= 0 ? 'pos' : 'neg') + '">' + (patrVsAplic >= 0 ? 'O patrimônio supera a aplicação em ' + R0(patrVsAplic) + '.' : 'A aplicação equivalente estaria ' + R0(-patrVsAplic) + ' à frente neste mês.') + '</p></article>');
    $('#strategies').innerHTML = cards.join('');

    $('#marcos').innerHTML = marcos(c).map(function (m) { return '<li><b>' + m[0] + '</b><span>' + m[1] + '</span></li>'; }).join('');
  }

  function marcos(c) {
    var sr = c.serie, n = S.prazo, out = [], find = function (fn) { for (var i = 0; i < sr.length; i++) if (fn(sr[i])) return sr[i]; return null; };
    var lastVendaAplic = null; sr.forEach(function (s) { if (s.venda > s.aplic) lastVendaAplic = s; });
    if (lastVendaAplic && lastVendaAplic.t < n) out.push(['mês ' + lastVendaAplic.t, 'Até aqui, vender a carta contemplada rende mais do que aplicar o mesmo dinheiro.']);
    var naoCobre = find(function (s) { return s.venda < s.pago; });
    if (naoCobre) out.push(['mês ' + naoCobre.t, 'A partir daqui, o valor de venda deixa de cobrir o que já foi pago. A carta passa a valer mais para usar ou manter.']);
    else out.push(['todo o plano', 'O valor estimado de venda cobre o que foi pago em todos os meses.']);
    var dep = c.r0.aposReducao;
    if (S.reducao > 0 && S.reducaoAte && dep) out.push(['mês ' + dep.t, 'Fim da parcela reduzida: de ' + R(c.r0.meses[dep.t - 2].parcela) + ' para ' + R(dep.parcela) + ', diluindo a diferença no restante do plano.']);
    var patrPos = find(function (s) { return s.patr > 0; });
    if (patrPos) out.push(['mês ' + patrPos.t, 'O patrimônio na cota fica positivo: o crédito atualizado passa a superar o saldo a pagar.']);
    var patrAplic = find(function (s) { return s.patr > s.aplic; });
    out.push(patrAplic ? ['mês ' + patrAplic.t, 'O patrimônio na cota passa a superar a aplicação equivalente.'] : ['fim do plano', 'Com aplicação a ' + P(S.aplicacao) + ' ao mês, manter a cota não supera a aplicação: o ganho dela está em usar o crédito ou vender a carta.']);
    var fim = sr[sr.length - 1];
    out.push(['mês ' + n, 'Crédito final de ' + R0(c.r0.creditoFinal) + ' com reajuste. Total pago até o fim sem contemplação: ' + R0(fim.pago) + (fim.saldo > 1 ? ' e ' + R0(fim.saldo) + ' a acertar na contemplação' : '') + '.']);
    var ord = function (m) { var k = /^mês (\d+)/.exec(m[0]); return k ? +k[1] : 1e6; };
    return out.sort(function (a, b) { return ord(a) - ord(b); });
  }

  function renderContemplacao(c) {
    var rt = c.rt, L = rt.lance || {}, t = Math.min(S.mes, S.prazo), o = OBJ[S.obj];
    var forma = S.lanceTipo === 'nenhum' ? 'por sorteio' : S.lanceTipo === 'fixo' ? 'com lance fixo de ' + P(S.lancePct, 0) : 'com lance livre de ' + P(S.lancePct, 0);
    $('#cont-title').textContent = 'Contemplação no mês ' + t;
    $('#cont-sub').textContent = 'Cenário ' + forma + (L.valor ? (S.embutido ? ', embutido no crédito' : ', pago com recurso próprio') + (S.abatimento === 'prazo' ? ', usado para reduzir o prazo.' : ', usado para reduzir a parcela.') : '.') + ' A data real depende de sorteio ou lance.';
    var mini = function (a, b, s) { return '<div class="mini"><span>' + a + '</span><strong>' + b + '</strong>' + (s ? '<small>' + s + '</small>' : '') + '</div>'; };
    $('#cont-grid').innerHTML = [
      mini('Crédito no mês ' + t, R0(L.creditoMes), 'com reajuste'),
      mini('Lance', L.valor ? R0(L.valor) : 'sem lance', L.valor ? (L.embutido ? 'embutido no crédito' : 'do bolso do cliente') : 'contemplação por sorteio'),
      mini('Crédito para ' + o.bem, R0(L.creditoLiberado), L.saldoNoCredito ? 'já abatido o saldo da redução' : 'valor liberado'),
      mini('Parcela depois', L.mesesRestantes ? R(L.parcelaDepois) : 'quitado', L.mesesRestantes ? 'por ' + L.mesesRestantes + ' meses' : ''),
      mini('Pago até a contemplação', R0(c.serie[t - 1].pago)),
      mini('Total pago no plano', R0(rt.totalPago + (L.desembolso || 0)), L.desembolso ? 'inclui o lance' : ''),
      mini('Último mês', 'mês ' + rt.ultimoMes, rt.ultimoMes < S.prazo ? (S.prazo - rt.ultimoMes) + ' meses antes do prazo' : ''),
      mini('Taxa total', P(S.taxaAdm + S.fundoReserva), 'sem juros')
    ].join('');
    var vals = []; for (var i = 1; i <= S.prazo; i++) vals.push(rt.meses[i - 1] ? rt.meses[i - 1].parcela : 0);
    lineChart($('#chart-parcela'), { n: S.prazo, cursor: t, animate: animateNext, height: 240, label: 'Parcela mês a mês', series: [{ key: 'p', color: '#111111', values: vals }] });
  }

  function renderComparativo(c) {
    var o = OBJ[S.obj], C = S.credito;
    var cons = C * (100 + S.taxaAdm + S.fundoReserva) / 100;
    var taxaMes = o.finUnidade === 'aa' ? A.anualParaMensal(S.finTaxa) : S.finTaxa;
    var f = A.financiar(C, taxaMes, Math.max(1, S.finPrazo), S.sistema);
    var max = Math.max(cons, f.total), win = cons <= f.total;
    $('#comp-sub').textContent = 'Crédito de ' + R0(C) + ' no consórcio (' + S.prazo + ' meses) e no financiamento (' + S.finPrazo + ' meses a ' + P(S.finTaxa) + (o.finUnidade === 'aa' ? ' ao ano' : ' ao mês') + ', ' + S.sistema.toUpperCase() + ').';
    $('#compare').innerHTML =
      '<article class="cmp' + (win ? ' win' : '') + '"><h3>Consórcio</h3><div class="big">' + R0(cons) + '</div><div class="bar"><i data-w="' + (cons / max * 100) + '"></i></div>' +
      '<dl><div><dt>Primeira parcela</dt><dd>' + R(c.r0.primeiraParcela) + '</dd></div><div><dt>Custo além do crédito</dt><dd>' + R0(cons - C) + '</dd></div><div><dt>Juros</dt><dd>sem juros</dd></div><div><dt>Entrada</dt><dd>não exige</dd></div></dl></article>' +
      '<article class="cmp' + (!win ? ' win' : '') + '"><h3>Financiamento</h3><div class="big">' + R0(f.total) + '</div><div class="bar"><i data-w="' + (f.total / max * 100) + '"></i></div>' +
      '<dl><div><dt>Primeira parcela</dt><dd>' + R(f.primeira) + '</dd></div><div><dt>Última parcela</dt><dd>' + R(f.ultima) + '</dd></div><div><dt>Juros</dt><dd>' + R0(f.juros) + '</dd></div><div><dt>Entrada</dt><dd>' + (o.finUnidade === 'aa' ? 'em geral 20% ou mais' : 'conforme o banco') + '</dd></div></dl></article>' +
      '<div class="saving"><span>' + (win ? 'Diferença a favor do consórcio' : 'Diferença a favor do financiamento') + '</span><strong>' + R0(Math.abs(f.total - cons)) + '</strong></div>';
    requestAnimationFrame(function () { $$('#compare .bar i').forEach(function (i) { i.style.width = i.dataset.w + '%'; }); });
    $('#comp-note').textContent = 'Valores do consórcio em reais de hoje: parcelas e crédito são corrigidos pelo índice do grupo ao longo do plano. No financiamento o bem vem na hora; no consórcio, na contemplação. O cálculo do financiamento não inclui TR, seguros e tarifas.';
  }

  function renderTabela(c) {
    var sr = c.serie, rows = [], sel = Math.ceil(S.mes / 12);
    for (var t = 12; t <= S.prazo + 11; t += 12) {
      var s = sr[Math.min(t, S.prazo) - 1], a = Math.ceil(s.t / 12), g = s.venda - s.pago;
      rows.push('<tr' + (a === sel ? ' class="sel"' : '') + '><td>' + a + 'º ano</td><td>' + R(s.parcela) + '</td><td>' + R0(s.pago) + '</td><td>' + R0(s.credito) + '</td><td>' + R0(s.venda) +
        '</td><td class="' + (g >= 0 ? 'pos' : 'neg') + '">' + signed(g) + '</td><td>' + R0(s.aplic) + '</td><td class="' + (s.patr >= 0 ? '' : 'neg') + '">' + (s.patr < 0 ? '−' : '') + R0(Math.abs(s.patr)) + '</td><td><span class="tag ' + PH[s.fase][0] + '">' + PH[s.fase][1] + '</span></td></tr>');
      if (t >= S.prazo) break;
    }
    $('#tabela').innerHTML = '<thead><tr><th>Ano</th><th>Parcela</th><th>Total pago</th><th>Crédito</th><th>Venda da carta</th><th>Resultado da venda</th><th>Mesmo valor aplicado</th><th>Patrimônio na cota</th><th>Fase</th></tr></thead><tbody>' + rows.join('') + '</tbody>';
  }

  function heroTitle(v) {
    if (v) heroTitle.v = v;
    var nome = S.cliente ? S.cliente.split(' ')[0] : '';
    $('#hero-title').innerHTML = (nome ? esc(nome) + ', sua parcela fica em ' : (S.reducao > 0 ? 'Parcela reduzida de ' : 'Parcela de ')) + '<strong>' + heroTitle.v + '</strong>';
  }

  /* ---------- Campos ---------- */
  var FIELDS = ['prazo', 'lancePct', 'taxaAdm', 'fundoReserva', 'reducao', 'reducaoAte', 'reajusteTaxa', 'venda', 'aplicacao', 'finTaxa', 'finPrazo'];
  function fmtField(k, v) { return /prazo|reducaoAte|finPrazo/i.test(k) ? String(Math.round(v)) : String(v).replace('.', ','); }
  function syncInputs() {
    var a = document.activeElement;
    if (a !== $('#credito')) $('#credito').value = S.credito ? num.format(S.credito) : '';
    if (a !== $('#cliente')) $('#cliente').value = S.cliente || '';
    FIELDS.forEach(function (k) { var el = $('#' + k); if (el && a !== el) el.value = fmtField(k, S[k]); });
    ['reajustePeriodo', 'reducaoBase', 'lanceBase', 'abatimento'].forEach(function (k) { $('#' + k).value = String(S[k]); });
    $('#grupo').innerHTML = B.santander.grupos.map(function (g) { return '<option value="' + g.id + '"' + (g.id === S.grupo ? ' selected' : '') + '>' + g.id + ' · ' + P(g.taxaAdm) + ' · dia ' + g.vencimento + '</option>'; }).join('');
    $('#embutido').checked = !!S.embutido;
  }

  var raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }

  function bind() {
    $('#form').addEventListener('submit', function (e) { e.preventDefault(); });
    $$('[data-obj]').forEach(function (b) { b.addEventListener('click', function () { if (S.obj === b.dataset.obj) return; reset(b.dataset.obj, true); animateNext = true; render(); }); });
    $$('[data-lance]').forEach(function (b) { b.addEventListener('click', function () {
      S.lanceTipo = b.dataset.lance; if (S.lanceTipo === 'fixo') S.lancePct = base().lancePct; if (S.lanceTipo === 'livre' && S.lancePct === base().lancePct) S.lancePct = 30; render(); }); });
    $$('[data-sis]').forEach(function (b) { b.addEventListener('click', function () { S.sistema = b.dataset.sis; render(); }); });
    $('#chips').addEventListener('click', function (e) { var b = e.target.closest('[data-chip]'); if (!b) return; S.credito = +b.dataset.chip; render(); });
    $('#credito').addEventListener('input', function (e) {
      var d = e.target.value.replace(/\D/g, '').slice(0, 10); S.credito = +d || 0;
      e.target.value = d ? num.format(+d) : ''; schedule();
    });
    $('#credito').addEventListener('blur', function () { if (S.credito < 1000) { S.credito = OBJ[S.obj].credito; render(); } });
    $('#cliente').addEventListener('input', function (e) { S.cliente = e.target.value.trim(); heroTitle(); });
    $('#grupo').addEventListener('change', function (e) { applyGrupo(e.target.value); render(); });
    FIELDS.forEach(function (k) {
      var el = $('#' + k);
      el.addEventListener('input', function () { var v = parseNum(el.value); if (k === 'prazo' && (v < 12 || v > 240)) return; S[k] = v; if (k === 'prazo' && S.mes > v) S.mes = v; schedule(); });
      el.addEventListener('blur', function () { if (k === 'prazo') S.prazo = Math.min(240, Math.max(12, Math.round(S.prazo))); render(); });
    });
    ['reajustePeriodo', 'reducaoBase', 'lanceBase', 'abatimento'].forEach(function (k) { $('#' + k).addEventListener('change', function (e) { S[k] = k === 'reajustePeriodo' ? +e.target.value : e.target.value; render(); }); });
    $('#embutido').addEventListener('change', function (e) { S.embutido = e.target.checked; render(); });
    ['mes', 'scrub'].forEach(function (id) { $('#' + id).addEventListener('input', function (e) { S.mes = +e.target.value; schedule(); }); });
    $('#restaurar').addEventListener('click', function () { var b = base(); PREM.forEach(function (k) { S[k] = b[k]; }); if (S.grupo) applyGrupo(S.grupo); render(); toast('Premissas restauradas.'); });
    $('#legend-evo').addEventListener('click', function (e) { var b = e.target.closest('[data-serie]'); if (!b) return; S.hidden[b.dataset.serie] = !S.hidden[b.dataset.serie]; render(); });

    // arrastar no gráfico escolhe o mês
    var ch = $('#chart-evo'), dragging = false;
    var pick = function (e) { if (!ch._x) return; var t = Math.min(S.prazo, Math.max(1, ch._x(e.clientX))); if (t !== S.mes) { S.mes = t; schedule(); } };
    ch.addEventListener('pointerdown', function (e) { dragging = true; ch.setPointerCapture(e.pointerId); pick(e); });
    ch.addEventListener('pointermove', function (e) { if (dragging) pick(e); });
    ch.addEventListener('pointerup', function () { dragging = false; });

    // abas
    var tabs = $$('[role=tab]');
    var show = function (id, focus) {
      S.tab = id;
      tabs.forEach(function (t) { var on = t.id === 'tab-' + id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
      $$('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + id; });
      animateNext = true; render();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.id.slice(4)); });
      t.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); show(tabs[(i + d + tabs.length) % tabs.length].id.slice(4), true); } });
    });
    if (S.tab !== 'evolucao') show(S.tab);

    $('#btn-apresentar').addEventListener('click', function () {
      var on = !document.body.classList.contains('present');
      document.body.classList.toggle('present', on); this.setAttribute('aria-pressed', on);
      if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
      if (!on && document.fullscreenElement) document.exitFullscreen().catch(function () {});
      animateNext = true; setTimeout(render, 60);
    });
    document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && document.body.classList.contains('present')) { document.body.classList.remove('present'); $('#btn-apresentar').setAttribute('aria-pressed', 'false'); setTimeout(render, 60); } });
    $('#btn-pdf').addEventListener('click', function () { buildPrint(); setTimeout(function () { window.print(); }, 50); });
    window.addEventListener('beforeprint', buildPrint);
    $('#btn-whats').addEventListener('click', openWhats);
    $('#whats-copy').addEventListener('click', function () {
      var t = $('#whats-text').value;
      var btn = this, ok = function () { btn.textContent = 'Copiado'; clearTimeout(btn._h); btn._h = setTimeout(function () { btn.textContent = 'Copiar texto'; }, 2000); };
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(ok, function () { $('#whats-text').select(); document.execCommand('copy'); ok(); });
    });
    $('#whats-num').addEventListener('input', function (e) {
      var d = e.target.value.replace(/\D/g, '').slice(0, 11);
      e.target.value = d.length > 6 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4) : d.length > 2 ? '(' + d.slice(0, 2) + ') ' + d.slice(2) : d;
    });
    $('#whats-open').addEventListener('click', function () {
      var d = $('#whats-num').value.replace(/\D/g, ''), t = encodeURIComponent($('#whats-text').value);
      if (d && d.length < 10) { toast('Confira o número com DDD.'); return; }
      window.open('https://wa.me/' + (d ? '55' + d : '') + '?text=' + t, '_blank', 'noopener');
    });
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(render, 120); });
  }

  /* ---------- WhatsApp ---------- */
  function resumoTexto() {
    var c = cache, o = OBJ[S.obj], b = base(), g = grupoInfo(), r0 = c.r0, L = c.rt.lance || {}, at = c.serie[Math.min(S.mes, S.prazo) - 1];
    var nome = S.cliente ? S.cliente.split(' ')[0] : '';
    var linhas = [
      'Olá' + (nome ? ', ' + nome : '') + '! Segue a simulação que conversamos:', '',
      '*' + o.nome + ' · ' + b.administradora.replace('Consórcio ', '') + (o.base === 'santander' && g ? ' (grupo ' + g.id + ')' : '') + '*',
      '• Crédito: ' + R0(S.credito),
      '• Prazo: ' + S.prazo + ' meses',
      '• Parcela' + (S.reducao > 0 ? ' reduzida' : '') + ': ' + R(r0.primeiraParcela) + (S.reducao > 0 ? (S.reducaoAte ? ' até a ' + S.reducaoAte + 'ª assembleia ou a contemplação' : ' até a contemplação') : ''),
    ];
    if (S.reducao > 0 && S.reducaoAte && r0.aposReducao) linhas.push('• A partir do mês ' + r0.aposReducao.t + ': ' + R(r0.aposReducao.parcela) + ' (estimado com reajuste)');
    linhas.push('• Taxa total: ' + P(S.taxaAdm + S.fundoReserva) + ', sem juros e sem entrada', '');
    linhas.push('*Se for contemplado no mês ' + Math.min(S.mes, S.prazo) + '*');
    linhas.push('• Crédito para usar: ' + R0(L.creditoLiberado) + (L.valor ? ' (lance de ' + R0(L.valor) + (L.embutido ? ' embutido' : '') + ')' : ''));
    if (L.mesesRestantes) linhas.push('• Parcela depois: ' + R(L.parcelaDepois) + ' por ' + L.mesesRestantes + ' meses');
    linhas.push('• Ou vender a carta: cerca de ' + R0(at.venda) + ', tendo pago ' + R0(at.pago));
    linhas.push('', 'Valores estimados, sujeitos às regras do grupo e à análise de crédito.', 'Alex Ferreira · AM Consórcios');
    return linhas.join('\n');
  }
  function openWhats() { $('#whats-copy').textContent = 'Copiar texto'; $('#whats-text').value = resumoTexto(); var d = $('#dlg-whats'); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }

  /* ---------- Proposta para impressão ---------- */
  function buildPrint() {
    var c = cache, o = OBJ[S.obj], b = base(), g = grupoInfo(), r0 = c.r0, L = c.rt.lance || {}, t = Math.min(S.mes, S.prazo), at = c.serie[t - 1];
    var hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    var kp = function (a, v, hl) { return '<div' + (hl ? ' class="hl"' : '') + '><dt>' + a + '</dt><dd>' + v + '</dd></div>'; };
    var rows = [];
    for (var y = 1; y <= Math.ceil(S.prazo / 12); y++) {
      var s = c.serie[Math.min(y * 12, S.prazo) - 1];
      rows.push('<tr><td>' + y + 'º ano</td><td>' + R(s.parcela) + '</td><td>' + R0(s.pago) + '</td><td>' + R0(s.credito) + '</td><td>' + R0(s.venda) + '</td><td>' + R0(s.aplic) + '</td><td>' + (s.patr < 0 ? '−' : '') + R0(Math.abs(s.patr)) + '</td></tr>');
    }
    var depois = S.reducao > 0 && S.reducaoAte && r0.aposReducao ? kp('A partir do mês ' + r0.aposReducao.t, R(r0.aposReducao.parcela)) : kp('Parcela integral hoje', R(r0.parcelaIntegralHoje));
    var el = $('#print');
    el.innerHTML =
      '<header class="pr-head"><div class="pr-brand"><img src="' + $('.brand img').getAttribute('src').replace('dourado.svg', 'dourado-escuro.svg') + '" alt=""><span>AM Consórcios e Investimentos<small>Planejamento. Estratégia. Clareza.</small></span></div><div class="pr-meta">Simulação de ' + hoje + '<br>Válida conforme as condições do grupo</div></header>' +
      '<h1>' + (S.cliente ? esc(S.cliente) + ', sua' : 'Sua') + ' simulação de ' + o.nome.charAt(0).toLowerCase() + o.nome.slice(1) + '</h1>' +
      '<p class="pr-sub">' + o.nome + ' · ' + b.administradora + (o.base === 'santander' && g ? ' · Grupo ' + g.id + ' · vencimento dia ' + g.vencimento : '') + '</p>' +
      '<dl class="pr-kpis">' + kp('Crédito', R0(S.credito)) + kp(S.reducao > 0 ? 'Parcela reduzida' : 'Parcela', R(r0.primeiraParcela), true) + depois + kp('Taxa total · sem juros', P(S.taxaAdm + S.fundoReserva) + ' / ' + S.prazo + ' m') + '</dl>' +
      '<h2>O que a cota vale ao longo do tempo</h2><div class="pr-chart chart" id="pr-chart"></div>' +
      '<h2>Se a carta for contemplada no mês ' + t + '</h2><div class="pr-strat">' +
      '<div><b>Usar o crédito</b><span class="v">' + R0(L.creditoLiberado) + '</span><br>Parcela depois: ' + (L.mesesRestantes ? R(L.parcelaDepois) : 'quitado') + '</div>' +
      '<div><b>Vender a carta</b><span class="v">' + R0(at.venda) + '</span><br>Pago até aqui: ' + R0(at.pago) + '</div>' +
      '<div><b>Manter como investimento</b><span class="v">' + (at.patr < 0 ? '−' : '') + R0(Math.abs(at.patr)) + '</span><br>Crédito atualizado: ' + R0(at.credito) + '</div></div>' +
      '<h2>Pontos de virada</h2><table class="pr-marcos"><tbody>' + marcos(c).map(function (m) { return '<tr><td>' + m[0] + '</td><td>' + m[1] + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<div class="pr-page"></div><h2>Ano a ano</h2><table><thead><tr><th>Ano</th><th>Parcela</th><th>Total pago</th><th>Crédito</th><th>Venda da carta</th><th>Mesmo valor aplicado</th><th>Patrimônio na cota</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>' +
      '<p class="pr-legal">' + esc($('#disclaimer').textContent) + '</p>' +
      '<footer class="pr-foot"><span><b>Alex Ferreira</b> · AM Consórcios e Investimentos · CNPJ 50.315.065/0001-02</span><span>WhatsApp (11) 99608-6204 · amconsorcios.com</span></footer>';
    var pc = $('#pr-chart'); pc.style.width = '680px';
    var tmp = document.createElement('div'); tmp.style.width = '680px'; tmp.style.position = 'absolute'; tmp.style.left = '-9999px'; document.body.appendChild(tmp);
    lineChart(tmp, { n: S.prazo, cursor: t, height: 250, label: 'Evolução da cota', series: ['venda', 'patr', 'pago', 'aplic'].map(function (k) { return { color: PRINT[k], dash: k === 'aplic', cap: k === 'aplic', capLabel: 'Aplicação', hidden: !!S.hidden[k], values: c.serie.map(function (s) { return s[k]; }) }; }) });
    pc.innerHTML = tmp.innerHTML + '<p class="pr-legal pr-leg">' + ['venda', 'patr', 'pago', 'aplic'].filter(function (k) { return !S.hidden[k]; }).map(function (k) { return '<span data-c="' + k + '">' + (k === 'aplic' ? '┅' : '━') + '</span> ' + LABELS[k]; }).join(' · ') + '. Linha pontilhada: mês ' + t + '.</p>';
    $$('[data-c]', pc).forEach(function (x) { x.style.color = PRINT[x.dataset.c]; x.style.fontWeight = '600'; });
    tmp.remove(); pc.style.width = '';
    var tip = pc.querySelector('.tip'); if (tip) tip.remove();
  }

  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2200); }

  /* ---------- Início ---------- */
  if (!loadHash()) reset('imovel');
  // Vindo do painel de contatos: o nome do cliente chega pela sessão do navegador, nunca pela URL.
  try { var veio = sessionStorage.getItem('am-sim-cliente'); if (veio) { S.cliente = veio; sessionStorage.removeItem('am-sim-cliente'); } } catch (e) { /* sem armazenamento: segue sem o nome */ }
  bind();
  render();
})();
