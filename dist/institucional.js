const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const configureScroll = () => {
  window.amScroll?.destroy();window.amScroll=null;
  if(!reducedMotion.matches && window.Lenis){
    window.amScroll=new Lenis({autoRaf:true,lerp:.09,smoothWheel:true,syncTouch:false,anchors:false,prevent:node=>!!node.closest?.('[data-lenis-prevent]')});
    if(document.querySelector('.briefing-dialog[open]'))window.amScroll.stop();
  }
};
configureScroll();reducedMotion.addEventListener('change',configureScroll);
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');
  if(!window.amScroll||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||!link||link.hasAttribute('data-briefing')||link.target==='_blank')return;
  const url=new URL(link.href,location.href);
  if(url.origin!==location.origin||url.pathname!==location.pathname||!url.hash)return;
  let target;try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)));}catch{return;}
  if(!target)return;event.preventDefault();
  window.amScroll.scrollTo(target,{offset:-30,onComplete:()=>{history.pushState(null,'',url.hash);if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}});
});
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const closeMenu = () => { menu?.setAttribute('aria-expanded','false'); nav?.classList.remove('open'); };
menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e => { if(e.key==='Escape'&&nav?.classList.contains('open')){closeMenu();menu?.focus();} });
document.querySelectorAll('[role="tablist"]').forEach(group => {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const choose = tab => tabs.forEach(t => { const selected=t===tab; t.setAttribute('aria-selected',String(selected)); t.tabIndex=selected?0:-1; const panel=document.getElementById(t.getAttribute('aria-controls')); if(panel)panel.hidden=!selected; });
  tabs.forEach((tab,i) => { tab.addEventListener('click',() => choose(tab)); tab.addEventListener('keydown',e=>{ let j=i; if(e.key==='ArrowDown'||e.key==='ArrowRight')j=(i+1)%tabs.length; else if(e.key==='ArrowUp'||e.key==='ArrowLeft')j=(i-1+tabs.length)%tabs.length; else if(e.key==='Home')j=0; else if(e.key==='End')j=tabs.length-1; else return; e.preventDefault(); choose(tabs[j]);tabs[j].focus(); }); });
});
if(!reducedMotion.matches && 'IntersectionObserver' in window){
  document.querySelectorAll('.steps,.principles,.mentor-lines,.module-list,.process-list,.footer-main').forEach(group=>{
    [...group.children].forEach((element,i)=>{element.setAttribute('data-reveal','');element.style.setProperty('--reveal-delay',`${Math.min(i,3)*90}ms`);});
  });
  document.querySelectorAll('.mentor-portrait,.mentor-wide,.journey-ribbon,.education-note,.imagery-note').forEach(element=>element.setAttribute('data-reveal',''));
  document.documentElement.classList.add('motion-ready');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});
  document.querySelectorAll('[data-reveal]').forEach(e=>observer.observe(e));
}
const film=document.querySelector('.cinema video'), filmButton=document.querySelector('.film-control');
if(film){
  let manuallyPaused=false;
  const reflect=()=>{if(!filmButton)return; filmButton.setAttribute('aria-label',film.paused?'Reproduzir vídeo':'Pausar vídeo');filmButton.setAttribute('aria-pressed',String(film.paused));filmButton.innerHTML=film.paused?'<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5 3 17 10 5 17Z"/></svg>':'<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5 3h3v14H5zm7 0h3v14h-3z"/></svg>';};
  filmButton?.addEventListener('click',()=>{manuallyPaused=!film.paused; if(film.paused)film.play().catch(()=>{});else film.pause();});film.addEventListener('play',reflect);film.addEventListener('pause',reflect);
  if(reducedMotion.matches)film.pause();
  if('IntersectionObserver' in window)new IntersectionObserver(([e])=>{if(!e.isIntersecting)film.pause();else if(!manuallyPaused&&!reducedMotion.matches)film.play().catch(()=>{});},{threshold:.12}).observe(film);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)film.pause();else if(!manuallyPaused&&!reducedMotion.matches)film.play().catch(()=>{});});reflect();
}
// Keep native wheel/touch scrolling; the rail reflects the page and supports keyboard and pointer use.
if(matchMedia('(pointer:fine)').matches){
  const rail=document.createElement('div'),thumb=document.createElement('div');rail.className='scroll-rail';thumb.className='scroll-thumb';rail.append(thumb);rail.tabIndex=0;rail.setAttribute('role','scrollbar');rail.setAttribute('aria-label','Posição da página');rail.setAttribute('aria-controls','main');rail.setAttribute('aria-orientation','vertical');rail.setAttribute('aria-valuemin','0');document.body.append(rail);document.documentElement.classList.add('custom-scrollbar-ready');
  let max=0,track=1,dragging=false,originY=0,originScroll=0,timer;
  const sync=()=>{max=Math.max(0,document.documentElement.scrollHeight-innerHeight);const h=Math.max(34,rail.clientHeight*innerHeight/document.documentElement.scrollHeight);track=Math.max(1,rail.clientHeight-h);thumb.style.height=h+'px';thumb.style.transform=`translateY(${(scrollY/max||0)*track}px)`;rail.style.display=max?'block':'none';rail.setAttribute('aria-valuemax',String(Math.round(max)));rail.setAttribute('aria-valuenow',String(Math.round(scrollY)));};
  const wake=()=>{rail.classList.add('is-active');clearTimeout(timer);timer=setTimeout(()=>{if(!dragging)rail.classList.remove('is-active');},1100);};
  addEventListener('scroll',()=>{sync();wake();},{passive:true});addEventListener('resize',sync);addEventListener('load',sync);document.addEventListener('pointermove',e=>{if(e.clientX>innerWidth-38)wake();},{passive:true});
  rail.addEventListener('pointerdown',e=>{e.preventDefault();window.amScroll?.stop();dragging=true;originY=e.clientY;originScroll=scrollY;rail.setPointerCapture(e.pointerId);wake();if(e.target!==thumb){const y=e.clientY-rail.getBoundingClientRect().top-thumb.clientHeight/2;scrollTo({top:Math.min(max,Math.max(0,y/track*max)),behavior:'instant'});originScroll=scrollY;}});
  rail.addEventListener('pointermove',e=>{if(dragging)scrollTo({top:Math.min(max,Math.max(0,originScroll+(e.clientY-originY)/track*max)),behavior:'instant'});});
  const stop=()=>{dragging=false;window.amScroll?.start();wake();};rail.addEventListener('pointerup',stop);rail.addEventListener('pointercancel',stop);
  rail.addEventListener('keydown',e=>{const d={ArrowDown:70,ArrowUp:-70,PageDown:innerHeight*.8,PageUp:-innerHeight*.8};if(e.key in d){e.preventDefault();scrollBy({top:d[e.key],behavior:reducedMotion.matches?'instant':'smooth'});}if(e.key==='Home'||e.key==='End'){e.preventDefault();scrollTo({top:e.key==='Home'?0:max,behavior:reducedMotion.matches?'instant':'smooth'});}});sync();
}
