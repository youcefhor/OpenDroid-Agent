"""Deterministic public source bundle, excluding credentials/runtime/user data."""
from pathlib import Path
import hashlib,json,zipfile,io
root=Path(__file__).resolve().parents[1]
prefixes=['app','db','drizzle','lib','worker','scripts','services','tests','web','src','docs','examples']
names=['README.md','CONTRIBUTING.md','LICENSE','.gitignore','.npmrc','.openai/hosting.json','.env.example','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','tsconfig.json','next.config.ts','vite.config.ts','drizzle.config.ts','postcss.config.mjs','cloudflare-env.d.ts','eslint.config.mjs','public/favicon.svg']
files=[]
for name in names:
 p=root/name
 if p.is_file():files.append(p)
for prefix in prefixes:
 for p in (root/prefix).rglob('*'):
  if p.is_file() and not any(part in ('node_modules','__pycache__','.git','.wrangler','.sites-runtime') or part.endswith('.egg-info') for part in p.parts) and p.suffix not in ('.pyc','.zip'):
   files.append(p)
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(set(files)):
  info=zipfile.ZipInfo(p.relative_to(root).as_posix(),date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,p.read_bytes())
data=out.getvalue();sha=hashlib.sha256(data).hexdigest();public=root/'public';public.mkdir(exist_ok=True)
for p in public.glob('nexus-source-*.zip'):p.unlink()
name='nexus-source-'+sha[:12]+'.zip';(public/name).write_bytes(data)
(public/'source-manifest.json').write_text(json.dumps({'file':name,'sha256':sha,'files':len(set(files))},indent=2)+'\n')
print(json.dumps({'file':name,'sha256':sha,'files':len(set(files)),'bytes':len(data)}))
