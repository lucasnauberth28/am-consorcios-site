const DAY = 86400;
const CONSENT_VERSION = 'briefing-2026-10-05-v2';
const enc = new TextEncoder(), dec = new TextDecoder();
const toB64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const clean = (v,max=160) => typeof v==='string' ? v.trim().slice(0,max) : '';
const choices = {
  interest:['imovel','carro','investir','carta','venda','mentoria'],
  credit:['nao-sei','ate-100k','100-300k','300-600k','600k-1m','mais-1m'],
  timing:['planejamento','12-24','avaliar-agora'],
  experience:['primeiro','conheco','tenho-cota'],
  businessStage:['iniciar','organizar','desenvolver'],
};
export function validCPF(value){
 const c=String(value).replace(/\D/g,'');if(!/^\d{11}$/.test(c)||/^(\d)\1{10}$/.test(c))return false;
 for(let n=9;n<=10;n++){let sum=0;for(let i=0;i<n;i++)sum+=Number(c[i])*(n+1-i);const digit=(sum*10)%11;if((digit===10?0:digit)!==Number(c[n]))return false;}return true;
}
export function validateBriefing(p,now=new Date()){
 const e={};if(!p||typeof p!=='object'||Array.isArray(p))return {errors:{form:'Revise as informações enviadas.'}};
 const data={interest:clean(p.interest),name:clean(p.name,100),phone:clean(p.phone,20).replace(/\D/g,''),email:clean(p.email,160),city:clean(p.city,100),cpf:clean(p.cpf,20).replace(/\D/g,''),birthDate:clean(p.birthDate,10),credit:clean(p.credit),monthlyBudget:clean(p.monthlyBudget,20),timing:clean(p.timing),experience:clean(p.experience),company:clean(p.company,120),businessStage:clean(p.businessStage),teamSize:clean(p.teamSize,30),note:clean(p.note,600),source:clean(p.source,80),consent:true,consentVersion:CONSENT_VERSION,deliveryMode:'manual'};
 if(!choices.interest.includes(data.interest))e.interest='Escolha o seu objetivo.';
 if(data.name.length<3||!data.name.includes(' '))e.name='Informe seu nome e sobrenome.';
 if(!/^[1-9]\d{9,10}$/.test(data.phone))e.phone='Informe um telefone brasileiro com DDD.';
 if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))e.email='Confira o e-mail.';
 if(p.consent!==true)e.consent='Autorize o contato para enviar o briefing.';
 if(p.consentVersion!==CONSENT_VERSION)e.consent='Atualize a página e confirme a autorização.';
 if(data.interest==='mentoria'){
  if(data.company.length<2)e.company='Informe o nome da empresa.';
  if(!choices.businessStage.includes(data.businessStage))e.businessStage='Escolha o estágio da empresa.';
  if(!['1','2-5','6-20','mais-20','definir'].includes(data.teamSize))e.teamSize='Selecione o tamanho da equipe.';
  data.cpf='';data.birthDate='';data.credit='';data.monthlyBudget='';data.timing='';data.experience='';
 }else{
  if(!choices.credit.includes(data.credit))e.credit='Selecione uma faixa de crédito.';
  if(!choices.timing.includes(data.timing))e.timing='Selecione o seu momento.';
  if(!choices.experience.includes(data.experience))e.experience='Selecione sua familiaridade com consórcio.';
  if(data.monthlyBudget&&(!/^\d{1,7}(\.\d{1,2})?$/.test(data.monthlyBudget)||Number(data.monthlyBudget)<=0||Number(data.monthlyBudget)>1000000))e.monthlyBudget='Informe um valor mensal válido.';
  if(data.cpf&&!validCPF(data.cpf))e.cpf='Confira os dígitos do CPF.';
  if(data.birthDate){const d=new Date(data.birthDate+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==data.birthDate||d>now||d.getUTCFullYear()<1900)e.birthDate='Confira a data de nascimento.';}
  data.company='';data.businessStage='';data.teamSize='';
 }
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(p.requestId||''))e.form='Atualize a página e tente novamente.';
 return {data,errors:e};
}
async function key(env,purpose){const bytes=fromB64(env.AM_BRIEFING_KEY||'');if(bytes.length!==32)throw new Error('Configuration unavailable');return crypto.subtle.importKey('raw',bytes,purpose==='AES'?{name:'AES-GCM'}:{name:'HMAC',hash:'SHA-256'},false,purpose==='AES'?['encrypt','decrypt']:['sign']);}
async function seal(data,id,env){const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(id)},await key(env,'AES'),enc.encode(JSON.stringify(data)));return {iv:toB64(iv),ciphertext:toB64(ciphertext)};}
async function unseal(row,env){return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(row.iv),additionalData:enc.encode(row.id)},await key(env,'AES'),fromB64(row.ciphertext))));}
function db(env){if(!env.DB)throw new Error('Storage unavailable');return env.DB;}
function authorized(request,env){const email=request.headers.get('oai-authenticated-user-email');return !!email&&!!env.AM_OPERATOR_EMAIL&&email.toLowerCase()===env.AM_OPERATOR_EMAIL.toLowerCase();}
function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});}
async function body(request){const reader=request.body?.getReader();if(!reader)throw new Error('empty');let size=0,parts=[];try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12000){await reader.cancel();throw new Error('large');}parts.push(value);}const all=new Uint8Array(size);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}return JSON.parse(dec.decode(all));}finally{reader.releaseLock();}}
const ADMIN_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Briefings recebidos | AM</title><link rel="icon" href="/assets/favicon.svg"><link rel="stylesheet" href="/institucional.css"><link rel="stylesheet" href="/briefing.css"><script src="/briefings-admin.js" defer></script></head><body class="briefings-admin"><header class="inbox-header"><a href="/index.html">AM Consórcios e Investimentos</a><span>Atendimento manual</span></header><main class="wrap"><div class="inbox-intro"><div><span class="label">Área de atendimento</span><h1>Briefings recebidos.</h1><p>Dados enviados pelo visitante para uma primeira conversa. Nenhum dado representa aprovação de crédito.</p></div><button type="button" class="button dark" id="refresh-inbox">Atualizar</button></div><p id="inbox-status" role="status">Carregando solicitações…</p><div id="inbox-list"></div><p class="inbox-retention">Esta área é restrita ao responsável autorizado. Os briefings ficam disponíveis por 30 dias.</p></main></body></html>`;
async function handler(request,env){
 const u=new URL(request.url),path=u.pathname;
 if(path==='/api/briefings/status'&&request.method==='GET'){
  await key(env,'AES');await db(env).prepare('SELECT 1 FROM briefings LIMIT 1').first();return json({ready:true});
 }
 if(path==='/api/briefings'&&request.method==='POST'){
  const origin=request.headers.get('Origin');const expected=env.AM_SITE_ORIGIN||u.origin;if(origin!==expected||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'A solicitação deve partir deste site.'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Formato inválido.'},415);
  let p;try{p=await body(request);}catch{return json({error:'Não foi possível ler o formulário.'},400);}
  if(p.website)return json({error:'Não foi possível enviar o formulário.'},400);
  const {data,errors}=validateBriefing(p);if(Object.keys(errors).length)return json({error:'Revise os campos indicados.',fields:errors},422);
  const now=Math.floor(Date.now()/1000),store=db(env),id=p.requestId;
  const ip=request.headers.get('CF-Connecting-IP')||'private-preview';const ipHash=toB64(await crypto.subtle.sign('HMAC',await key(env,'HMAC'),enc.encode(ip)));
  // Idempotent retry: an existing UUID must also match the same network fingerprint.
  const existing=await store.prepare('SELECT id,ip_hash,expires_at FROM briefings WHERE id = ?').bind(id).first();
  if(existing){if(existing.ip_hash!==ipHash||existing.expires_at<=now)return json({error:'Reabra o formulário para iniciar outro envio.'},409);return json({id,received:true});}
  const count=await store.prepare('SELECT COUNT(*) AS n FROM briefings WHERE ip_hash = ? AND created_at > ?').bind(ipHash,now-3600).first();if(count.n>=12)return json({error:'Muitos envios recentes. Tente novamente mais tarde.'},429);
  const sealed=await seal(data,id,env);
  await store.batch([store.prepare('DELETE FROM briefings WHERE expires_at <= ?').bind(now),store.prepare('INSERT INTO briefings (id,created_at,expires_at,ciphertext,iv,ip_hash,consent_version) VALUES (?,?,?,?,?,?,?)').bind(id,now,now+30*DAY,sealed.ciphertext,sealed.iv,ipHash,CONSENT_VERSION)]);
  return json({id,received:true},201);
 }
 if(path==='/api/briefings'&&request.method==='GET'){
  if(!authorized(request,env))return json({error:'Acesso restrito ao responsável autorizado.'},403);
  const cursor=(u.searchParams.get('before')||'').split(':');const before=Number(cursor[0])||Math.floor(Date.now()/1000)+1,beforeId=cursor[1]||'zzzz',now=Math.floor(Date.now()/1000);
  await db(env).prepare('DELETE FROM briefings WHERE expires_at <= ?').bind(now).run();
  const result=await db(env).prepare('SELECT id,created_at,ciphertext,iv FROM briefings WHERE expires_at > ? AND (created_at < ? OR (created_at = ? AND id < ?)) ORDER BY created_at DESC,id DESC LIMIT 51').bind(now,before,before,beforeId).all();
  const rows=result.results.slice(0,50),items=await Promise.all(rows.map(async row=>({id:row.id,createdAt:row.created_at,...await unseal(row,env)})));
  return json({items,nextBefore:result.results.length>50?rows.at(-1).created_at+':'+rows.at(-1).id:null});
 }
 if(path==='/briefings'||path==='/briefings/'){
  if(!authorized(request,env))return new Response('Área restrita.',{status:403,headers:{'Cache-Control':'no-store'}});
  return new Response(ADMIN_HTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
 }
 if(path.startsWith('/api/'))return json({error:'Recurso indisponível.'},404);
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 return env.ASSETS.fetch(request);
}
export default {async fetch(request,env){try{const res=await handler(request,env);const out=new Response(res.body,res);out.headers.set('Referrer-Policy','strict-origin');out.headers.set('X-Content-Type-Options','nosniff');if(new URL(request.url).pathname.startsWith('/api/'))out.headers.set('Referrer-Policy','no-referrer');return out;}catch{console.error('Briefing service unavailable; no personal payload logged.');return json({error:'O envio está indisponível agora. Seus dados continuam no formulário; tente novamente ou fale com a AM.'},503);}}};
