document.querySelectorAll('.menu-toggle').forEach(button=>{
  const nav=document.getElementById(button.getAttribute('aria-controls'));
  button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{button.setAttribute('aria-expanded','false');nav.classList.remove('open')}));
});
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
if(!reducedMotion.matches){
  document.documentElement.classList.add('js-motion');
  const targets=[...document.querySelectorAll('main > .section, main > .cta-band, .journey-card, .principle, .editorial-card, .program-card, .stat')];
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}});
  },{threshold:.1,rootMargin:'0px 0px -25px 0px'});
  targets.forEach(el=>{el.classList.add('reveal');observer.observe(el)});
}
const whatsapp=document.createElement('div');
whatsapp.className='whatsapp-dock';
whatsapp.innerHTML='<button class="whatsapp-trigger" type="button" aria-label="WhatsApp da AM Investimentos" aria-controls="whatsapp-note" aria-expanded="false" title="WhatsApp"><svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 2.5a13.4 13.4 0 0 0-11.6 20.1L2.5 29.5l7.1-1.9A13.5 13.5 0 1 0 16 2.5Zm0 24.5a11 11 0 0 1-5.6-1.5l-.4-.2-4.2 1.1 1.1-4.1-.3-.4A11 11 0 1 1 16 27Zm6.1-8.2c-.3-.1-1.9-.9-2.2-1-.3-.1-.5-.1-.7.2s-.8 1-1 1.2-.4.2-.7.1a9 9 0 0 1-4.5-3.9c-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.6l-1-2.4c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.9 1.2 3.3 1.4 3.5a12.5 12.5 0 0 0 4.8 4.4 4.4 0 0 0 2.7.8c.9 0 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.2-.6-.4Z"/></svg></button><div class="whatsapp-note" id="whatsapp-note" hidden><strong>Atendimento via WhatsApp</strong><p>O canal de contato da AM será incluído após a definição do número comercial.</p></div>';
document.body.appendChild(whatsapp);
const waButton=whatsapp.querySelector('button'),waNote=whatsapp.querySelector('.whatsapp-note');
const closeWa=()=>{waNote.hidden=true;waButton.setAttribute('aria-expanded','false')};
waButton.addEventListener('click',()=>{const open=waNote.hidden;waNote.hidden=!open;waButton.setAttribute('aria-expanded',String(open))});
document.addEventListener('click',event=>{if(!whatsapp.contains(event.target))closeWa()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeWa()});

if(window.matchMedia('(pointer: fine)').matches){
  const rail=document.createElement('div'),thumb=document.createElement('div');
  rail.className='scroll-rail';rail.setAttribute('role','scrollbar');rail.setAttribute('aria-label','Posição da página');rail.setAttribute('aria-orientation','vertical');rail.setAttribute('aria-valuemin','0');rail.tabIndex=0;
  thumb.className='scroll-thumb';rail.appendChild(thumb);document.body.appendChild(rail);
  document.documentElement.classList.add('custom-scrollbar-ready');
  let maxScroll=0,available=0,thumbHeight=34,dragStart=0,dragScroll=0,dragging=false;
  const sync=()=>{
    maxScroll=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
    const railHeight=rail.clientHeight;
    thumbHeight=Math.max(34,railHeight*window.innerHeight/document.documentElement.scrollHeight);
    available=Math.max(1,railHeight-thumbHeight);
    thumb.style.height=thumbHeight+'px';
    thumb.style.transform='translateY('+((window.scrollY/maxScroll||0)*available)+'px)';
    rail.style.display=maxScroll?'block':'none';
    rail.setAttribute('aria-valuemax',String(Math.round(maxScroll)));
    rail.setAttribute('aria-valuenow',String(Math.round(window.scrollY)));
  };
  window.addEventListener('scroll',sync,{passive:true});window.addEventListener('resize',sync);window.addEventListener('load',sync);
  let pointerInside=false;
  document.addEventListener('pointermove',event=>{if(event.pointerType==='mouse'){pointerInside=true;rail.classList.add('is-active')}},{passive:true});
  document.documentElement.addEventListener('pointerenter',()=>{pointerInside=true;rail.classList.add('is-active')});
  document.documentElement.addEventListener('pointerleave',()=>{pointerInside=false;if(!dragging)rail.classList.remove('is-active')});
  document.addEventListener('visibilitychange',()=>{
    rail.classList.remove('is-active');
    if(!document.hidden&&pointerInside)requestAnimationFrame(()=>requestAnimationFrame(()=>rail.classList.add('is-active')));
  });
  rail.addEventListener('pointerdown',event=>{
    event.preventDefault();rail.setPointerCapture(event.pointerId);dragging=true;dragStart=event.clientY;dragScroll=window.scrollY;
    if(event.target!==thumb){const rect=rail.getBoundingClientRect();window.scrollTo({top:Math.max(0,(event.clientY-rect.top-thumbHeight/2)/available*maxScroll),behavior:'instant'});dragScroll=window.scrollY}
  });
  rail.addEventListener('pointermove',event=>{if(dragging)window.scrollTo({top:Math.max(0,Math.min(maxScroll,dragScroll+(event.clientY-dragStart)/available*maxScroll)),behavior:'instant'})});
  const stopDrag=()=>{dragging=false};rail.addEventListener('pointerup',stopDrag);rail.addEventListener('pointercancel',stopDrag);
  rail.addEventListener('keydown',event=>{
    const jump={ArrowDown:60,ArrowUp:-60,PageDown:window.innerHeight*.8,PageUp:-window.innerHeight*.8};
    if(event.key in jump){event.preventDefault();window.scrollBy({top:jump[event.key],behavior:reducedMotion.matches?'instant':'smooth'})}
    if(event.key==='Home'||event.key==='End'){event.preventDefault();window.scrollTo({top:event.key==='Home'?0:maxScroll,behavior:reducedMotion.matches?'instant':'smooth'})}
  });
  if(!reducedMotion.matches){
    let wheelTarget=window.scrollY,wheelFrame=0;
    const glide=()=>{
      const current=window.scrollY,next=current+(wheelTarget-current)*.17;
      if(Math.abs(wheelTarget-current)<.7){window.scrollTo({top:wheelTarget,behavior:'instant'});wheelFrame=0;return}
      window.scrollTo({top:next,behavior:'instant'});wheelFrame=requestAnimationFrame(glide);
    };
    window.addEventListener('wheel',event=>{
      if(event.ctrlKey||event.shiftKey||event.target.closest('input,select,textarea,[data-native-scroll]'))return;
      const discrete=event.deltaMode!==0||Math.abs(event.deltaY)>=75;
      if(!discrete)return;
      event.preventDefault();
      const delta=event.deltaY*(event.deltaMode===1?25:event.deltaMode===2?window.innerHeight:1);
      wheelTarget=Math.max(0,Math.min(maxScroll,(wheelFrame?wheelTarget:window.scrollY)+Math.max(-600,Math.min(600,delta))));
      if(!wheelFrame)wheelFrame=requestAnimationFrame(glide);
    },{passive:false});
  }
  sync();
}
const form=document.getElementById('sim-form');
if(form){
  const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
  const fields={credit:form.elements.credit,months:form.elements.months,fee:form.elements.fee,reserve:form.elements.reserve,adjustment:form.elements.adjustment};
  const write=(id,value)=>{document.getElementById(id).textContent=money.format(value)};
  const update=()=>{
    const credit=Number(fields.credit.value),months=Number(fields.months.value),fee=Number(fields.fee.value),reserve=Number(fields.reserve.value),annual=Number(fields.adjustment.value)/100;
    document.getElementById('months-label').textContent=months+' meses';
    if(!Number.isFinite(credit)||credit<10000||credit>2000000||!Number.isFinite(fee)||fee<0||fee>40||!Number.isFinite(reserve)||reserve<0||reserve>10)return;
    const base=credit*(1+(fee+reserve)/100),initial=base/months,years=Math.ceil(months/12);
    let total=0;const annualPayments=[];
    for(let y=0;y<years;y++){const count=Math.min(12,months-y*12);const payment=initial*Math.pow(1+annual,y);annualPayments.push(payment);total+=payment*count}
    write('initial-payment',initial);write('total-payment',total);write('last-payment',annualPayments.at(-1));write('base-cost',base);
    const chart=document.getElementById('chart'),max=Math.max(...annualPayments);
    chart.replaceChildren();
    annualPayments.forEach((payment,i)=>{
      const group=document.createElement('div');group.className='bar-group';group.title='Ano '+(i+1)+': '+money.format(payment)+'/mês';
      const bar=document.createElement('div');bar.className='bar';bar.style.height=(payment/max*88)+'%';
      group.appendChild(bar);
      if(i===0||i===years-1||i%Math.max(1,Math.ceil(years/5))===0){const label=document.createElement('label');label.textContent=String(i+1);group.appendChild(label)}
      chart.appendChild(group);
    });
    chart.setAttribute('aria-label','Parcela inicial '+money.format(initial)+', parcela no último ano '+money.format(annualPayments.at(-1))+', em '+years+' anos.');
  };
  form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('submit',e=>e.preventDefault());update();
}
