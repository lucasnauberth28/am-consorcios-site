import { mkdir, readdir, cp, rm } from 'node:fs/promises';
await rm('dist/client',{recursive:true,force:true});
await rm('dist/server',{recursive:true,force:true});
await mkdir('dist/client',{recursive:true});
await mkdir('dist/server',{recursive:true});
for(const f of await readdir('dist'))if(!['client','server','.openai'].includes(f))await cp(`dist/${f}`,`dist/client/${f}`,{recursive:true});
await cp('worker/index.js','dist/server/index.js');
console.log('Built institutional pages and briefing service.');
