import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{validateBriefing,validCPF} from '../worker/index.js';
const sample={requestId:'f48b9821-fdc0-4310-871f-7f97c71c1947',interest:'imovel',name:'Visitante Exemplo',phone:'11900000000',email:'visitante@example.test',credit:'100-300k',timing:'planejamento',experience:'primeiro',monthlyBudget:'1500',consent:true,consentVersion:'briefing-2026-10-05-v2'};
test('Validates contact, planning and explicit consent server-side',()=>{
 assert.deepEqual(validateBriefing(sample).errors,{});
 assert.ok(validateBriefing({...sample,consent:false}).errors.consent);
 assert.ok(validateBriefing({...sample,phone:'1'}).errors.phone);
 assert.ok(validateBriefing({...sample,monthlyBudget:'Infinity'}).errors.monthlyBudget);
 assert.ok(validateBriefing({...sample,interest:'arbitrary'}).errors.interest);
});
test('CPF and date are optional, but invalid identity fields are rejected',()=>{
 assert.deepEqual(validateBriefing({...sample,cpf:'',birthDate:''}).errors,{});
 assert.equal(validCPF('111.111.111-11'),false);
 assert.ok(validateBriefing({...sample,cpf:'123'}).errors.cpf);
 assert.ok(validateBriefing({...sample,birthDate:'2026-02-31'}).errors.birthDate);
 assert.ok(validateBriefing({...sample,birthDate:'2099-01-01'}).errors.birthDate);
});
test('Mentorship captures company context and drops consumer identity fields',()=>{
 const result=validateBriefing({...sample,interest:'mentoria',company:'Empresa Exemplo',businessStage:'iniciar',teamSize:'2-5',cpf:'123',birthDate:'wrong'});
 assert.deepEqual(result.errors,{});assert.equal(result.data.cpf,'');assert.equal(result.data.birthDate,'');assert.equal(result.data.credit,'');
});
test('Administration requires the configured operator identity',async()=>{
 for(const email of [null,'someone@example.test']){const headers=email?{'oai-authenticated-user-email':email}:{};const response=await worker.fetch(new Request('https://example.test/api/briefings',{headers}),{AM_OPERATOR_EMAIL:'owner@example.test'});assert.equal(response.status,403);}
 const response=await worker.fetch(new Request('https://example.test/briefings',{headers:{'oai-authenticated-user-email':'owner@example.test'}}),{AM_OPERATOR_EMAIL:'owner@example.test'});assert.equal(response.status,200);assert.match(await response.text(),/Briefings recebidos/);
});
test('Cross-origin writes and malformed consent do not reach storage',async()=>{
 const cross=await worker.fetch(new Request('https://example.test/api/briefings',{method:'POST',headers:{Origin:'https://bad.test','Content-Type':'application/json'},body:JSON.stringify(sample)}),{});assert.equal(cross.status,403);
 const invalid=await worker.fetch(new Request('https://example.test/api/briefings',{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json'},body:JSON.stringify({...sample,consent:false})}),{});assert.equal(invalid.status,422);
});
test('Saved payload is encrypted, retries deduplicate and only the operator can read',async()=>{
 const rows=new Map();
 const DB={prepare(sql){let params=[];return {bind(...p){params=p;return this;},async first(){if(sql.startsWith('SELECT id,ip_hash'))return rows.get(params[0])||null;if(sql.startsWith('SELECT COUNT'))return {n:0};return null;},async all(){return {results:[...rows.values()]};},async run(){if(sql.startsWith('INSERT')){const [id,created_at,expires_at,ciphertext,iv,ip_hash,consent_version]=params;rows.set(id,{id,created_at,expires_at,ciphertext,iv,ip_hash,consent_version});}return {success:true};}};},async batch(statements){return Promise.all(statements.map(s=>s.run()));}};
 const env={DB,AM_OPERATOR_EMAIL:'owner@example.test',AM_BRIEFING_KEY:btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))};
 const submit=()=>worker.fetch(new Request('https://example.test/api/briefings',{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json'},body:JSON.stringify(sample)}),env);
 assert.equal((await submit()).status,201);assert.equal((await submit()).status,200);assert.equal(rows.size,1);const row=[...rows.values()][0];assert.ok(!row.ciphertext.includes(sample.name));assert.ok(!row.ciphertext.includes(sample.phone));
 const result=await worker.fetch(new Request('https://example.test/api/briefings',{headers:{'oai-authenticated-user-email':'owner@example.test'}}),env);assert.equal(result.status,200);const body=await result.json();assert.equal(body.items[0].name,sample.name);
});
