"""Reproducible Hostinger package.
Usage: python scripts/build-hostinger.py [--preview] [--dominio=novodominio.com.br] [--email=contato@novodominio.com.br]
--dominio troca o endereço do site (canonical, Open Graph, sitemap, robots, JSON-LD, rodapé do simulador).
--email troca o e-mail de contato publicado. Sem as opções, usa amassessoriapatrimonial.com.br e adm@amassessoriapatrimonial.com.br."""
from pathlib import Path
import re,shutil,sys
r=Path(__file__).resolve().parents[1]
preview='--preview' in sys.argv
def opt(name,default):
 for a in sys.argv[1:]:
  if a.startswith('--'+name+'='):return a.split('=',1)[1].strip()
 return default
OLD_DOMAIN,OLD_EMAIL='amassessoriapatrimonial.com.br','adm@amassessoriapatrimonial.com.br'
domain=opt('dominio',OLD_DOMAIN).removeprefix('https://').removeprefix('http://').removeprefix('www.').strip('/')
email=opt('email',OLD_EMAIL)
if not re.fullmatch(r'[a-z0-9-]+(\.[a-z0-9-]+)+',domain):sys.exit('Domínio inválido: '+domain)
if not re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+',email):sys.exit('E-mail inválido: '+email)
base='/homologacao' if preview else ''
out=r/'tmp'/('hostinger-preview' if preview else 'hostinger-production')
if out.exists():shutil.rmtree(out)
shutil.copytree(r/'dist',out,ignore=shutil.ignore_patterns('client','server','.openai','briefings-admin.js'))
shutil.copytree(r/'hostinger/public',out,dirs_exist_ok=True)
# Os simuladores do site usam o mesmo motor de cálculo do simulador da equipe.
shutil.copy(r/'hostinger/public/admin/simulador/calc.js',out/'assets'/'am-calc.js')
for p in out.rglob('*'):
 if not p.is_file() or p.suffix not in ['.html','.js','.css','.txt','.xml']:continue
 s=p.read_text()
 for token in ['action="/','href="/','src="/','href=\'/','src=\'/']:s=s.replace(token,token+('homologacao/' if preview else ''))
 if p.name=='briefing.js':s=s.replace("fetch('/api/briefings'", "fetch('"+base+"/api/briefings.php'")
 if p.suffix=='.html' and preview:
  s=re.sub(r'<meta name="robots" content="[^"]*">','',s)
  s=s.replace('</head>','<meta name="robots" content="noindex,nofollow"></head>')
  # Preview sharing image/url must be publicly accessible at this deployment.
  s=s.replace('https://amassessoriapatrimonial.com.br/assets/hero-poster.jpg','https://amassessoriapatrimonial.com.br/homologacao/assets/hero-poster.jpg')
  s=re.sub(r'(<meta property="og:url" content=")https://amassessoriapatrimonial.com.br/',r'\1https://amassessoriapatrimonial.com.br/homologacao/',s)
 # Novo domínio/e-mail: o e-mail primeiro, para não ser alterado pela troca do domínio.
 s=s.replace(OLD_EMAIL,email)
 s=s.replace('https://www.'+OLD_DOMAIN,'https://'+domain).replace('https://'+OLD_DOMAIN,'https://'+domain)
 if p.name=='simulador.js':s=s.replace(OLD_DOMAIN,domain)
 p.write_text(s)
# Cache busting: versioned URLs for the site's own CSS/JS so browsers never mix old scripts with new pages.
import hashlib
versions={}
for name in ['site-v2.js','site-v2.css','assets/am-calc.js','assets/lenis.min.js','assets/lenis.css']:
 f=out/name
 if f.exists():versions[name]=hashlib.sha256(f.read_bytes()).hexdigest()[:10]
for p in out.glob('*.html'):
 s=p.read_text()
 for name,v in versions.items():s=s.replace(f'{name}"',f'{name}?v={v}"')
 p.write_text(s)
# Simulador da equipe: mesma regra de versão para os arquivos próprios.
sim=out/'admin'/'simulador'
if sim.exists():
 sv={n:hashlib.sha256((sim/n).read_bytes()).hexdigest()[:10] for n in ['simulador.css','simulador.js','calc.js']}
 page=sim/'_simulador.html';s=page.read_text()
 for n,v in sv.items():s=s.replace(f'"{n}"',f'"{n}?v={v}"')
 page.write_text(s)
if not preview:
 # Endereço único: http e www vão para https://dominio, mantendo o caminho.
 ht=out/'.htaccess'
 rule=('RewriteEngine On\n# Endereço único: https, sem www.\n'
  'RewriteCond %{HTTPS} off [OR]\nRewriteCond %{HTTP_HOST} ^www\\. [NC]\n'
  'RewriteRule ^ https://'+domain+'%{REQUEST_URI} [R=301,L]\n')
 ht.write_text(ht.read_text().replace('RewriteEngine On\n',rule,1))
if preview:
 # A página de erro precisa do caminho completo da homologação.
 ht=out/'.htaccess';ht.write_text(ht.read_text().replace('ErrorDocument 404 /404.html','ErrorDocument 404 /homologacao/404.html'))
 # robots.txt only controls the origin root; meta noindex protects this subdirectory.
 (out/'robots.txt').write_text('User-agent: *\nDisallow: /admin/\nDisallow: /api/\n')
 (out/'sitemap.xml').unlink(missing_ok=True)
print(out)
