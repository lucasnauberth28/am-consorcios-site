'use strict';
(() => {
 const b = document.getElementById('toggle-pass'), i = document.getElementById('pass');
 if (!b || !i) return;
 b.addEventListener('click', () => { const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', show ? 'Esconder a senha' : 'Mostrar a senha'); i.focus(); });
})();
