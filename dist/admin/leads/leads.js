'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const key = 'am-fictitious-leads-demo-v1';
  const statuses = ['Novo', 'Em contato', 'Concluído'];
  const cls = status => ({'Novo':'new','Em contato':'talking','Concluído':'done'})[status];
  const goals = {
    'Imóvel': {icon:'<path d="m3 10 9-7 9 7v11H3Z"/><path d="M9 21v-8h6v8"/>', text:'Quer planejar a conquista de um imóvel e entender como o consórcio se encaixa no orçamento.'},
    'Veículo': {icon:'<path d="m5 7 2-3h10l2 3 2 5v7H3v-7Z"/><path d="M3 11h18M7 15h1m8 0h1M5 19v2m14-2v2"/>', text:'Busca uma alternativa para trocar de carro com planejamento e orientação sobre as parcelas.'},
    'Investimento': {icon:'<path d="M4 19V5m0 14h16M7 14l4-4 4 2 5-6"/>', text:'Já conhece o consórcio e quer conversar sobre as possibilidades, custos e riscos da estratégia.'},
    'Mentoria': {icon:'<path d="m2 8 10-5 10 5-10 5Z"/><path d="M6 11v6c4 3 8 3 12 0v-6m4-3v8"/>', text:'Quer estruturar uma operação de consórcios na empresa e conhecer a mentoria da AM.'},
    'Carta contemplada': {icon:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8m-8 4h8m-8 4h4"/>', text:'Quer avaliar uma carta contemplada, com análise das condições e orientação para a negociação.'}
  };
  const seed = () => [
    {id:'AM-DEMO-001',name:'Marina Alves',goal:'Imóvel',credit:350000,status:'Novo',minutes:12,timing:'Entre 6 e 12 meses',budget:'Até R$ 2.000 / mês',experience:'Primeiro contato com consórcio'},
    {id:'AM-DEMO-002',name:'Rafael Costa',goal:'Veículo',credit:100000,status:'Novo',minutes:47,timing:'Nos próximos 6 meses',budget:'Até R$ 900 / mês',experience:'Está comparando alternativas'},
    {id:'AM-DEMO-003',name:'Camila Rocha',goal:'Mentoria',credit:null,status:'Novo',minutes:125,timing:'Nos próximos 3 meses',company:'Empresa Exemplo',experience:'Quer começar a operar com consórcios'},
    {id:'AM-DEMO-004',name:'Felipe Santos',goal:'Investimento',credit:500000,status:'Em contato',minutes:230,timing:'Sem prazo definido',budget:'Até R$ 3.000 / mês',experience:'Já possui uma cota'},
    {id:'AM-DEMO-005',name:'Juliana Lima',goal:'Carta contemplada',credit:200000,status:'Em contato',minutes:1440,timing:'Nos próximos 3 meses',budget:'Prefere conversar com a AM',experience:'Conhece a modalidade'},
    {id:'AM-DEMO-006',name:'André Oliveira',goal:'Veículo',credit:80000,status:'Concluído',minutes:1800,timing:'Entre 6 e 12 meses',budget:'Até R$ 700 / mês',experience:'Primeiro contato com consórcio'}
  ];
  let leads = seed(), filter = 'Todos', selected = null, toastTimer;
  try { const saved = JSON.parse(sessionStorage.getItem(key)); if(Array.isArray(saved)&&saved.length&&saved.every(x=>typeof x.name==='string'&&goals[x.goal]&&statuses.includes(x.status)&&/^AM-DEMO-\d+$/.test(x.id)&&Number.isFinite(x.minutes))) leads=saved; } catch {}
  const save = () => { try {sessionStorage.setItem(key,JSON.stringify(leads));}catch{} };
  const money = n => n == null ? 'A definir' : new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n);
  const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = name => name.split(' ').map(x=>x[0]).slice(0,2).join('');
  const received = m => m===0?'Agora':m<60?`Há ${m} min`:m<1440?`Há ${Math.floor(m/60)} h`:'Ontem';
  const normalized = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const message = lead => `Olá, ${lead.name.split(' ')[0]}! Sou da AM Consórcios. Recebemos seu interesse em ${lead.goal.toLowerCase()} pelo site e gostaria de entender melhor seus planos. Podemos conversar?`;
  function notify(text) {clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3600);}
  function render() {
    $('count-new').textContent=leads.filter(x=>x.status==='Novo').length;
    $('count-talking').textContent=leads.filter(x=>x.status==='Em contato').length;
    $('count-done').textContent=leads.filter(x=>x.status==='Concluído').length;
    document.querySelectorAll('.tabs [data-filter]').forEach(button=>{const active=button.dataset.filter===filter;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    const query=normalized($('search').value.trim());
    const visible=leads.filter(x=>(filter==='Todos'||x.status===filter)&&normalized(x.name+' '+x.goal).includes(query));
    $('result-count').textContent=`${visible.length} ${visible.length===1?'contato':'contatos'} · Mais recentes primeiro`;
    $('rows').innerHTML=visible.map(lead=>`<tr><td><div class="person"><span class="avatar">${escape(initials(lead.name))}</span><div><strong>${escape(lead.name)}</strong><small>Formulário do site</small></div></div></td><td><span class="goal-cell"><svg viewBox="0 0 24 24" aria-hidden="true">${goals[lead.goal].icon}</svg>${escape(lead.goal)}</span></td><td class="money">${money(lead.credit)}</td><td class="received">${received(lead.minutes)}</td><td><span class="status ${cls(lead.status)}">${escape(lead.status)}</span></td><td><button class="open-contact" data-id="${escape(lead.id)}" aria-label="Ver contato de ${escape(lead.name)}">Ver contato</button></td></tr>`).join('');
    $('empty').hidden=visible.length!==0;
    $('rows').closest('table').hidden=visible.length===0;
  }
  function openDialog(dialog){dialog.classList.remove('closing');if(!dialog.open)dialog.showModal();}
  function closeDialog(dialog){if(!dialog.open)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches){dialog.close();return;}dialog.classList.add('closing');setTimeout(()=>{dialog.close();dialog.classList.remove('closing');},190);}
  function openLead(id){
    selected=leads.find(x=>x.id===id);if(!selected)return;
    $('contact-title').textContent=selected.name;
    $('detail-avatar').textContent=initials(selected.name);
    $('detail-reference').textContent=selected.id+' · '+received(selected.minutes);
    $('detail-status').textContent=selected.status;$('detail-status').className='status '+cls(selected.status);
    $('detail-goal').textContent=selected.goal;
    $('detail-summary').textContent=goals[selected.goal].text;
    const entries=[['Crédito desejado',money(selected.credit)],['Parcela desejada',selected.budget||'A definir com a AM'],['Quando pretende avançar',selected.timing],['Experiência',selected.experience],['Telefone','(11) 9XXXX-0000'],['E-mail','contato@example.com'],...(selected.company?[['Empresa',selected.company]]:[]),['Origem','Formulário do site'],['Consentimento','Contato autorizado · exemplo']];
    $('details').innerHTML=entries.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('');
    $('message').textContent=message(selected);$('status-select').value=selected.status;
    openDialog($('contact-dialog'));
  }
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;render();}));
  $('search').addEventListener('input',render);
  $('clear').addEventListener('click',()=>{filter='Todos';$('search').value='';render();$('search').focus();});
  $('rows').addEventListener('click',event=>{const button=event.target.closest('[data-id]');if(button)openLead(button.dataset.id);});
  document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.close').addEventListener('click',()=>closeDialog(dialog));dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog(dialog);});dialog.addEventListener('click',event=>{const rect=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))closeDialog(dialog);});});
  $('status-select').addEventListener('change',()=>{selected.status=$('status-select').value;save();render();$('detail-status').textContent=selected.status;$('detail-status').className='status '+cls(selected.status);notify('Situação atualizada nesta demonstração.');});
  $('email-preview').addEventListener('click',()=>openDialog($('email-dialog')));
  $('open-latest').addEventListener('click',()=>{closeDialog($('email-dialog'));openLead(leads[0].id);});
  $('whatsapp-preview').addEventListener('click',()=>{$('chat-message').textContent=message(selected);openDialog($('chat-dialog'));});
  $('start-contact').addEventListener('click',()=>{selected.status='Em contato';save();render();$('status-select').value=selected.status;$('detail-status').textContent=selected.status;$('detail-status').className='status talking';closeDialog($('chat-dialog'));notify('Contato marcado como em atendimento.');});
  $('simulate').addEventListener('click',()=>{const next=Math.max(...leads.map(x=>Number(x.id.split('-').at(-1))))+1;leads.unshift({id:`AM-DEMO-${String(next).padStart(3,'0')}`,name:`Contato Exemplo ${String(next).padStart(2,'0')}`,goal:'Imóvel',credit:300000,status:'Novo',minutes:0,timing:'Entre 6 e 12 meses',budget:'Até R$ 1.800 / mês',experience:'Primeiro contato com consórcio'});filter='Todos';$('search').value='';save();render();openDialog($('email-dialog'));notify('Novo contato fictício recebido pelo site.');});
  $('reset').addEventListener('click',()=>{leads=seed();filter='Todos';$('search').value='';save();render();notify('Exemplos restaurados.');});
  render();
})();
