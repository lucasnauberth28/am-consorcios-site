'use strict';
(() => {
 const $ = (id) => document.getElementById(id);
 const base = location.pathname.replace(/\/admin\/leads\/(?:index\.php)?$/, '');
 const endpoint = base + '/api/briefings.php';
 const labels = { imovel: 'Imóvel', carro: 'Automóvel', investir: 'Patrimônio', carta: 'Carta contemplada', venda: 'Negociar cota', mentoria: 'Para empresas' };
 const credit = { 'nao-sei': 'A conversar', 'ate-100k': 'Até R$ 100 mil', '100-300k': 'R$ 100–300 mil', '300-600k': 'R$ 300–600 mil', '600k-1m': 'R$ 600 mil–1 milhão', 'mais-1m': 'Acima de R$ 1 milhão' };
 const timing = { planejamento: 'Em planejamento', '12-24': '12 a 24 meses', 'avaliar-agora': 'Avaliar agora' };
 const experience = { primeiro: 'Primeiro contato', conheco: 'Já conhece', 'tenho-cota': 'Já possui cota' };
 const stage = { iniciar: 'Quer começar a vender consórcio', organizar: 'Já vende e quer melhorar', desenvolver: 'Está formando uma equipe' };
 const team = { '1': 'Só a pessoa', '2-5': '2 a 5 pessoas', '6-20': '6 a 20 pessoas', 'mais-20': 'Mais de 20 pessoas', definir: 'Equipe a definir' };
 const simObj = { imovel: 'imovel', carro: 'automovel', investir: 'investimento' };
 const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
 const brl0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
 let leads = [], filter = 'Todos', selected = null, csrf = '', next = null, busy = false, timer, cpfShown = false;

 const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
 const normalized = (v) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
 const initials = (v) => v.trim().split(/\s+/).filter((w) => w.length > 2 || /^[A-ZÀ-Ú]/.test(w)).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
 const cls = (s) => ({ 'Novo': 'new', 'Em contato': 'talking', 'Concluído': 'done' })[s];
 const first = (n) => n.trim().split(/\s+/)[0];
 const isEmp = (l) => l.interest === 'mentoria';
 const avatarCls = (l) => (isEmp(l) ? 'empresa' : l.interest === 'imovel' ? 'imovel' : '');
 const now = () => Math.floor(Date.now() / 1000);
 const when = (t) => {
  const d = new Date(t * 1000), today = new Date(), y = new Date(); y.setDate(today.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Hoje, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (same(d, y)) return 'Ontem, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
 };
 const fmtPhone = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 10 ? '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4) : d; };
 const fmtCpf = (c) => c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
 const maskCpf = (c) => '•••.' + c.slice(3, 6) + '.' + c.slice(6, 9) + '-••';

 // O que a pessoa simulou: campos estruturados (formulário novo) ou faixas do formulário antigo.
 function sim(l) {
  const c = +l.simCredit || 0, t = +l.simTerm || 0, p = +l.simInstallment || +l.monthlyBudget || 0;
  return {
   credito: c ? brl0.format(c) : (credit[l.credit] || 'A conversar'),
   prazo: t ? t + ' meses' : '',
   parcela: p ? brl.format(p) : '',
   curta: isEmp(l) ? 'encontro presencial' : [t ? t + ' meses' : '', p ? brl.format(p) + '/mês' : ''].filter(Boolean).join(' · ') || (timing[l.timing] || 'Sem detalhes'),
   modo: l.simMode === 'parcela' ? 'parcela' : l.simMode === 'credito' ? 'crédito' : '',
   lance: +l.simBid ? l.simBid + '%' : ''
  };
 }
 const origin = (l) => isEmp(l) ? 'Formulário Para empresas' : (l.source ? l.source.replace(/^Site · /, 'Simulação · ').replace('simulador da página principal', 'página principal') : 'Formulário do site');
 const message = (l) => {
  if (isEmp(l)) return `Olá, ${first(l.name)}! Sou o Alex, da AM Consórcios. Recebi o pedido de encontro${l.company ? ' para a ' + l.company : ''}. Qual o melhor dia para conversarmos?`;
  const s = sim(l), what = (labels[l.interest] || 'consórcio').toLowerCase();
  return +l.simCredit
   ? `Olá, ${first(l.name)}! Sou o Alex, da AM Consórcios. Vi sua simulação de ${what} de ${s.credito}${s.prazo ? ' em ' + s.prazo : ''}. Posso te mostrar os grupos disponíveis?`
   : `Olá, ${first(l.name)}! Sou o Alex, da AM Consórcios. Recebemos seu interesse em ${what} pelo site. Podemos conversar sobre seus planos?`;
 };
 function simulateHref(l) {
  const q = new URLSearchParams({ obj: simObj[l.interest] || 'imovel' });
  if (+l.simCredit >= 1000) q.set('credito', String(Math.round(+l.simCredit)));
  if (+l.simTerm >= 12) q.set('prazo', String(Math.min(240, Math.round(+l.simTerm))));
  return base + '/admin/simulador/#' + q.toString();
 }

 function notify(v) { clearTimeout(timer); $('toast').textContent = v; $('toast').classList.add('visible'); timer = setTimeout(() => $('toast').classList.remove('visible'), 3500); }
 async function api(url, options = {}) {
  const r = await fetch(url, { cache: 'no-store', credentials: 'same-origin', ...options });
  if (r.status === 401) { location.replace(base + '/admin/leads/login.php'); throw Error('Sessão encerrada.'); }
  const body = await r.json(); if (!r.ok) throw Error(body.error || 'Não foi possível concluir.'); return body;
 }

 function visible() {
  const q = normalized($('search').value.trim()), weekAgo = now() - 7 * 86400;
  return leads.filter((l) => (filter === 'Todos' || (filter === 'Semana' ? l.createdAt >= weekAgo : l.status === filter)) && normalized(l.name + ' ' + (labels[l.interest] || '') + ' ' + (l.company || '')).includes(q));
 }
 function render() {
  const count = (s) => leads.filter((l) => l.status === s).length;
  $('count-new').textContent = count('Novo'); $('count-talking').textContent = count('Em contato'); $('count-done').textContent = count('Concluído');
  $('count-week').textContent = leads.filter((l) => l.createdAt >= now() - 7 * 86400).length;
  document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter || (b.closest('.tabs') && filter === 'Semana' && b.dataset.filter === 'Todos'))));
  const list = visible();
  $('result-count').textContent = `${list.length} ${list.length === 1 ? 'contato exibido' : 'contatos exibidos'}${filter === 'Semana' ? ' dos últimos 7 dias' : ''} · os mais recentes primeiro`;
  const fresh = (l) => l.status === 'Novo' && l.createdAt >= now() - 86400;
  $('rows').innerHTML = list.map((l) => { const s = sim(l); return `<tr>
   <td><div class="person"><span class="avatar ${avatarCls(l)}">${esc(initials(l.name))}</span><div><strong>${esc(l.name)}</strong><small>${esc(origin(l))}</small></div>${fresh(l) ? '<span class="new-tag">recente</span>' : ''}</div></td>
   <td>${esc(labels[l.interest] || 'Consórcio')}</td>
   <td class="sim">${esc(isEmp(l) ? (team[l.teamSize] || 'Equipe a definir') : s.credito)}<small>${esc(s.curta)}</small></td>
   <td class="received">${esc(when(l.createdAt))}</td>
   <td><span class="status ${cls(l.status)}">${esc(l.status)}</span></td>
   <td class="right"><button class="open-btn" type="button" data-open="${esc(l.id)}" aria-label="Abrir contato de ${esc(l.name)}">Abrir</button></td></tr>`; }).join('');
  $('cards').innerHTML = list.map((l) => `<button class="card" type="button" data-open="${esc(l.id)}">
   <span class="card-top"><span class="avatar ${avatarCls(l)}">${esc(initials(l.name))}</span><span class="who"><strong>${esc(l.name)}</strong><small>${esc(labels[l.interest] || 'Consórcio')} · ${esc(isEmp(l) ? (team[l.teamSize] || '') : sim(l).credito)}</small></span><span class="status ${cls(l.status)}">${esc(l.status)}</span></span>
   <span class="meta">${esc(when(l.createdAt))} · ${esc(origin(l))}</span></button>`).join('');
  $('empty').hidden = list.length > 0;
  $('load-more').hidden = !next;
 }

 async function load(more = false, manual = false) {
  if (busy) return; busy = true; $('refresh').disabled = true; $('load-more').disabled = true;
  try {
   let url = endpoint; if (more && next) url += '?' + new URLSearchParams(next);
   const b = await api(url); leads = more ? leads.concat(b.items) : b.items; next = b.next; csrf = b.csrf; $('logout-csrf').value = csrf; render();
   if (manual) notify('Contatos atualizados.');
  } catch (e) { notify(e.message); } finally { busy = false; $('refresh').disabled = false; $('load-more').disabled = false; }
 }

 function close() {
  const d = $('contact-dialog'); if (!d.open) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) d.close();
  else { d.classList.add('closing'); setTimeout(() => { d.close(); d.classList.remove('closing'); }, 190); }
 }
 function setStatus(s) { $('detail-status').textContent = s; $('detail-status').className = 'status ' + cls(s); }
 function details(l) {
  const exp = new Date((l.createdAt + 30 * 86400) * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const cpf = l.cpf ? (cpfShown ? fmtCpf(l.cpf) : maskCpf(l.cpf)) : '';
  const rows = [];
  if (isEmp(l)) rows.push(['Empresa', l.company || 'Não informada'], ['Momento', stage[l.businessStage] || 'A conversar'], ['Equipe', team[l.teamSize] || 'A definir']);
  else {
   const s = sim(l);
   rows.push(['Crédito', s.credito]);
   if (s.prazo) rows.push(['Prazo', s.prazo]); else if (l.timing) rows.push(['Horizonte', timing[l.timing] || 'A conversar']);
   if (s.parcela) rows.push(['Parcela estimada', s.parcela]);
   if (s.modo) rows.push(['Simulou pelo valor da', s.modo]);
   if (+l.simCredit) rows.push(['Lance', s.lance || 'Sem lance']);
   if (l.experience) rows.push(['Experiência', experience[l.experience] || 'A conversar']);
  }
  rows.push(['WhatsApp', fmtPhone(l.phone)]);
  if (l.email) rows.push(['E-mail', l.email]);
  if (l.city) rows.push(['Cidade', l.city]);
  if (!isEmp(l)) rows.push(['CPF', cpf || 'Não informado']);
  rows.push(['Excluído automaticamente em', exp]);
  $('details').innerHTML = rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}${k === 'CPF' && l.cpf ? `<button type="button" class="reveal" data-cpf>${cpfShown ? 'ocultar' : 'mostrar'}</button>` : ''}</dd></div>`).join('');
 }
 function open(id) {
  selected = leads.find((l) => l.id === id); if (!selected) return;
  const l = selected; cpfShown = false;
  $('contact-title').textContent = l.name; $('detail-avatar').textContent = initials(l.name); $('detail-avatar').className = 'avatar large ' + avatarCls(l);
  $('detail-reference').textContent = l.id.slice(0, 8).toUpperCase() + ' · ' + when(l.createdAt) + ' · ' + origin(l);
  setStatus(l.status);
  $('detail-goal').textContent = labels[l.interest] || 'Consórcio';
  $('detail-summary').textContent = isEmp(l)
   ? `Quer um encontro presencial para a equipe. ${stage[l.businessStage] || ''}${l.teamSize ? ', ' + (team[l.teamSize] || '').toLowerCase() : ''}.`
   : (l.note || 'Um novo contato para conhecer melhor.');
  details(l);
  $('message').textContent = message(l);
  const canSim = !isEmp(l);
  $('simulate').hidden = !canSim; $('simulate').href = canSim ? simulateHref(l) : '#';
  $('actions-hint').textContent = canSim ? 'O WhatsApp abre com a mensagem pronta; você decide quando enviar. O simulador abre já com o crédito e o prazo que a pessoa escolheu no site.' : 'O WhatsApp abre com a mensagem pronta; você decide quando enviar.';
  $('status-select').value = l.status;
  $('delete-confirm').hidden = true; $('delete-lead').hidden = false;
  $('contact-dialog').showModal();
 }

 document.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.filter; render(); }));
 $('search').addEventListener('input', render);
 $('clear').addEventListener('click', () => { filter = 'Todos'; $('search').value = ''; render(); });
 $('refresh').addEventListener('click', () => load(false, true));
 $('load-more').addEventListener('click', () => load(true));
 const opener = (e) => { const b = e.target.closest('[data-open]'); if (b) open(b.dataset.open); };
 $('rows').addEventListener('click', opener); $('cards').addEventListener('click', opener);
 $('details').addEventListener('click', (e) => { if (e.target.closest('[data-cpf]') && selected) { cpfShown = !cpfShown; details(selected); } });
 $('contact-dialog').querySelector('.close').addEventListener('click', close);
 $('contact-dialog').addEventListener('cancel', (e) => { e.preventDefault(); close(); });
 $('contact-dialog').addEventListener('click', (e) => { if (e.target === $('contact-dialog')) { const r = $('contact-dialog').getBoundingClientRect(); if (e.clientX < r.left) close(); } });
 $('status-select').addEventListener('change', async () => {
  const l = selected, s = $('status-select').value; $('status-select').disabled = true;
  try { await api(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ id: l.id, status: s }) }); l.status = s; render(); setStatus(s); notify('Situação salva: ' + s + '.'); }
  catch (e) { $('status-select').value = l.status; notify(e.message); } finally { $('status-select').disabled = false; }
 });
 $('whatsapp-open').addEventListener('click', () => {
  const phone = selected.phone.replace(/\D/g, '');
  if (!/^[1-9]\d{9,10}$/.test(phone)) { notify('Confira o telefone antes de conversar.'); return; }
  window.open('https://wa.me/55' + phone + '?text=' + encodeURIComponent(message(selected)), '_blank', 'noopener,noreferrer');
 });
 $('simulate').addEventListener('click', () => { try { sessionStorage.setItem('am-sim-cliente', selected ? selected.name : ''); } catch (e) { /* sem armazenamento: o simulador abre sem o nome */ } });
 $('delete-lead').addEventListener('click', () => { $('confirm-text').innerHTML = `<strong>Excluir ${esc(first(selected.name))} de vez?</strong> Os dados somem do sistema e não dá para desfazer.`; $('delete-confirm').hidden = false; $('delete-lead').hidden = true; $('delete-no').focus(); });
 $('delete-no').addEventListener('click', () => { $('delete-confirm').hidden = true; $('delete-lead').hidden = false; $('delete-lead').focus(); });
 $('delete-yes').addEventListener('click', async () => {
  $('delete-yes').disabled = true;
  try { await api(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ id: selected.id }) }); leads = leads.filter((l) => l.id !== selected.id); close(); render(); notify('Contato excluído.'); }
  catch (e) { notify(e.message); } finally { $('delete-yes').disabled = false; }
 });
 load();
})();
