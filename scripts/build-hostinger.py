"""Reproducible Hostinger package. Usage: python scripts/build-hostinger.py [--preview]."""
from pathlib import Path
import re,shutil,sys
r=Path(__file__).resolve().parents[1]
preview='--preview' in sys.argv
base='/homologacao' if preview else ''
out=r/'tmp'/('hostinger-preview' if preview else 'hostinger-production')
if out.exists():shutil.rmtree(out)
shutil.copytree(r/'dist',out,ignore=shutil.ignore_patterns('client','server','.openai','briefings-admin.js'))
shutil.copytree(r/'hostinger/public',out,dirs_exist_ok=True)
for p in out.rglob('*'):
 if not p.is_file() or p.suffix not in ['.html','.js','.css','.txt','.xml']:continue
 s=p.read_text()
 for token in ['href="/','src="/','href=\'/','src=\'/']:s=s.replace(token,token+('homologacao/' if preview else ''))
 if p.name=='briefing.js':s=s.replace("fetch('/api/briefings'", "fetch('"+base+"/api/briefings.php'")
 if p.suffix=='.html' and preview:
  s=re.sub(r'<meta name="robots" content="[^"]*">','',s)
  s=s.replace('</head>','<meta name="robots" content="noindex,nofollow"></head>')
  # Preview sharing image/url must be publicly accessible at this deployment.
  s=s.replace('https://amconsorcios.com/assets/hero-poster.jpg','https://amconsorcios.com/homologacao/assets/hero-poster.jpg')
  s=re.sub(r'(<meta property="og:url" content=")https://amconsorcios.com/',r'\1https://amconsorcios.com/homologacao/',s)
 p.write_text(s)
# Cache busting: versioned URLs for the site's own CSS/JS so browsers never mix old scripts with new pages.
import hashlib
versions={}
for name in ['site-v2.js','site-v2.css','assets/lenis.min.js','assets/lenis.css']:
 f=out/name
 if f.exists():versions[name]=hashlib.sha256(f.read_bytes()).hexdigest()[:10]
for p in out.glob('*.html'):
 s=p.read_text()
 for name,v in versions.items():s=s.replace(f'{name}"',f'{name}?v={v}"')
 p.write_text(s)
if preview:
 # robots.txt only controls the origin root; meta noindex protects this subdirectory.
 (out/'robots.txt').write_text('User-agent: *\nDisallow: /admin/\nDisallow: /api/\n')
 (out/'sitemap.xml').unlink(missing_ok=True)
print(out)
