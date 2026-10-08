'use strict';
(() => {
 const $=id=>document.getElementById(id),statuses=['Novo','Em contato','Concluído'];
 const base=location.pathname.replace(/\/admin\/leads\/(?:index\.php)?$/,'');
 const endpoint=base+'/api/briefings.php';
 const labels={imovel:'Imóvel',carro:'Automóvel',investir:'Patrimônio',carta:'Carta contemplada',venda:'Negociar cota',mentoria:'Para empresas'};
 const credit={'nao-sei':'A conversar','ate-100k':'Até R$ 100 mil','100-300k':'R$ 100–300 mil','300-600k':'R$ 300–600 mil','600k-1m':'R$ 600 mil–1 milhão','mais-1m':'Acima de R$ 1 milhão'};
 const timing={planejamento:'Em planejamento','12-24':'12 a 24 meses','avaliar-agora':'Avaliar agora'};
 const experience={primeiro:'Primeiro contato',conheco:'Já conhece', 'tenho-cota':'Já possui cota'};
 const stage={iniciar:'Quer começar a vender consórcio',organizar:'Já vende e quer melhorar',desenvolver:'Está formando uma equipe'};
 let leads=[],filter='Todos',selected=null,csrf='',next=null,busy=false,timer;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalized=v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const initials=v=>v.trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('');
 const cls=s=>({'Novo':'new','Em contato':'talking','Concluído':'done'})[s];
 const date=t=>new Date(t*1000).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
 const message=l=>`Olá, ${l.name.split(' ')[0]}! Sou da AM Consórcios. Recebemos seu interesse em ${(labels[l.interest]||'consórcio').toLowerCase()} pelo site. Podemos conversar sobre seus planos?`;
 function notify(v){clearTimeout(timer);$('toast').textContent=v;$('toast').classList.add('visible');timer=setTimeout(()=>$('toast').classList.remove('visible'),4500);}
 async function api(url,options={}){const r=await fetch(url,{cache:'no-store',credentials:'same-origin',...options});if(r.status===401){location.replace(base+'/admin/leads/login.php');throw Error('Sessão encerrada.');}const body=await r.json();if(!r.ok)throw Error(body.error||'Não foi possível concluir.');return body;}
 function render(){for(const [s,id]of [['Novo','count-new'],['Em contato','count-talking'],['Concluído','count-done']])$(id).textContent=leads.filter(l=>l.status===s).length;
 document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.filter===filter);b.setAttribute('aria-pressed',String(b.dataset.filter===filter));});
 const q=normalized($('search').value.trim());const list=leads.filter(l=>(filter==='Todos'||l.status===filter)&&normalized(l.name+' '+labels[l.interest]).includes(q));
 $('result-count').textContent=`${list.length} contatos exibidos · ${leads.length} carregados · Mais recentes primeiro`;
 $('rows').innerHTML=list.map(l=>`<tr><td><div class="person"><span class="avatar">${esc(initials(l.name))}</span><div><strong>${esc(l.name)}</strong><small>Formulário do site</small></div></div></td><td>${esc(labels[l.interest]||'Consórcio')}</td><td class="money">${esc(credit[l.credit]||'A conversar')}</td><td class="received">${esc(date(l.createdAt))}</td><td><span class="status ${cls(l.status)}">${esc(l.status)}</span></td><td><button class="open-contact" data-id="${esc(l.id)}">Ver contato</button></td></tr>`).join('');$('empty').hidden=list.length!==0;$('rows').closest('table').hidden=list.length===0;$('load-more').hidden=!next;
 }
 async function load(more=false){if(busy)return;busy=true;$('refresh').disabled=true;$('load-more').disabled=true;
 try{let url=endpoint;if(more&&next)url+='?'+new URLSearchParams(next);const b=await api(url);leads=more?leads.concat(b.items):b.items;next=b.next;csrf=b.csrf;$('logout-csrf').value=csrf;render();}catch(e){notify(e.message);}finally{busy=false;$('refresh').disabled=false;$('load-more').disabled=false;}}
 function close(){const d=$('contact-dialog');if(!d.open)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches)d.close();else{d.classList.add('closing');setTimeout(()=>{d.close();d.classList.remove('closing');},190);}}
 function open(id){selected=leads.find(l=>l.id===id);if(!selected)return;const l=selected;
 $('contact-title').textContent=l.name;$('detail-avatar').textContent=initials(l.name);$('detail-reference').textContent=l.id.slice(0,8).toUpperCase()+' · '+date(l.createdAt);$('detail-status').textContent=l.status;$('detail-status').className='status '+cls(l.status);$('detail-goal').textContent=labels[l.interest];$('detail-summary').textContent=l.note||'Um novo contato para conhecer melhor.';
 const entries=[['Crédito desejado',credit[l.credit]||'A conversar'],['Orçamento mensal',l.monthlyBudget?Number(l.monthlyBudget).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'A conversar'],['Horizonte',timing[l.timing]||'A conversar'],['Experiência',experience[l.experience]||'A conversar'],['WhatsApp',l.phone],['E-mail',l.email||'Não informado'],['Cidade',l.city||'Não informada'],...(l.company?[['Empresa',l.company],['Conversa',stage[l.businessStage]],['Equipe',l.teamSize]]:[]),...(l.cpf?[['CPF',l.cpf]]:[]),...(l.birthDate?[['Nascimento',l.birthDate.split('-').reverse().join('/')]]:[]),['Origem',l.source],['Autorização',l.consentVersion]];
 $('details').innerHTML=entries.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');$('message').textContent=message(l);$('status-select').value=l.status;$('contact-dialog').showModal();
 }
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;render();}));$('search').addEventListener('input',render);$('clear').addEventListener('click',()=>{filter='Todos';$('search').value='';render();});$('refresh').addEventListener('click',()=>load());$('load-more').addEventListener('click',()=>load(true));$('rows').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b)open(b.dataset.id);});
 $('contact-dialog').querySelector('.close').addEventListener('click',close);$('contact-dialog').addEventListener('cancel',e=>{e.preventDefault();close();});
 $('status-select').addEventListener('change',async()=>{const l=selected,s=$('status-select').value;$('status-select').disabled=true;try{await api(endpoint,{method:'PATCH',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({id:l.id,status:s})});l.status=s;render();$('detail-status').textContent=s;$('detail-status').className='status '+cls(s);notify('Situação salva.');}catch(e){$('status-select').value=l.status;notify(e.message);}finally{$('status-select').disabled=false;}});
 $('whatsapp-open').addEventListener('click',()=>{const phone=selected.phone.replace(/\D/g,'');if(!/^[1-9]\d{9,10}$/.test(phone)){notify('Confira o telefone antes de conversar.');return;}window.open('https://wa.me/55'+phone+'?text='+encodeURIComponent(message(selected)),'_blank','noopener,noreferrer');});
 $('delete-lead').addEventListener('click',async()=>{if(!confirm('Excluir permanentemente este contato?'))return;$('delete-lead').disabled=true;try{await api(endpoint,{method:'DELETE',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({id:selected.id})});leads=leads.filter(l=>l.id!==selected.id);close();render();notify('Contato excluído.');}catch(e){notify(e.message);}finally{$('delete-lead').disabled=false;}});
 load();
})();
