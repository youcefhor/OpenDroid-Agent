/* Real HTTP + real database. Run against local preview, not public production. */
import assert from 'node:assert/strict';
const base=process.env.NEXUS_TEST_URL||'http://127.0.0.1:4173';
if(!/^http:\/\/(127\.0\.0\.1|localhost|terminal\.local):\d+$/.test(base))throw Error('Integration test refuses non-local origins');
class Client{cookie='';async request(path,method='GET',body){const response=await fetch(base+'/api/nexus/'+path,{method,headers:{Origin:base,...(this.cookie?{Cookie:this.cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(response.headers.get('set-cookie'))this.cookie=response.headers.get('set-cookie').split(';')[0];const data=await response.json();return {status:response.status,data};}}
const a=new Client(),b=new Client();let cases=0;const ok=(label)=>{cases++;console.log('PASS',label);};
let r=await a.request('agents');assert.equal(r.status,401);ok('anonymous agent listing denied');
r=await a.request('session','POST',{});assert.equal(r.status,200);assert.equal(r.data.user.kind,'guest');ok('server-persisted guest session');
await b.request('session','POST',{});
r=await a.request('agents','POST',{name:'Integration document analyst',tools:['analyze_document'],instructions:'Analyze source lines',mode:'evidence'});assert.equal(r.status,201);const agent=r.data;ok('create persisted agent');
r=await b.request('agents/'+agent.id);assert.equal(r.status,404);ok('cross-user agent access denied');
r=await a.request('agents/'+agent.id,'PUT',{...agent,description:'Version two'});assert.equal(r.status,200);assert.equal(r.data.version,2);ok('agent versions increment');
r=await a.request('agents/'+agent.id+'/versions');assert.equal(r.data.versions.length,2);ok('version history persisted');
r=await a.request('runs','POST',{agentId:agent.id,task:'Extract lines from uploaded document',document:'Alpha source line\nVerified document text',urls:[]});assert.equal(r.status,201);const run=r.data;
r=await a.request('runs/'+run.id+'/start','POST',{});assert.equal(r.data.status,'completed',JSON.stringify(r));ok('real document pipeline completed');
r=await a.request('runs/'+run.id);assert.match(r.data.result.report,/L2: Verified document text/);assert.equal(r.data.result.verified,1);assert.equal(r.data.artifacts.length,1);const artifact=r.data.artifacts[0].id;ok('result, provenance and artifact persisted');
r=await b.request('runs/'+run.id);assert.equal(r.status,404);ok('cross-user execution access denied');
r=await b.request('artifacts/'+artifact);assert.equal(r.status,404);ok('cross-user artifact access denied');
r=await a.request('runs');assert.ok(r.data.runs.some(x=>x.id===run.id));ok('execution visible in durable history');
r=await a.request('admin');assert.equal(r.status,403);ok('guest cannot become administrator');
r=await a.request('connections/openai','POST',{apiKey:'this-is-not-a-real-key'});assert.equal(r.status,503);ok('key rejected when local encryption secret missing');
const csrf=await fetch(base+'/api/nexus/agents',{method:'POST',headers:{Origin:'https://evil.example',Cookie:a.cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(csrf.status,403);ok('cross-origin write denied');
r=await a.request('agents/'+agent.id,'DELETE');assert.equal(r.status,200);ok('test agent deletion');
console.log(`${cases} real HTTP integration checks passed. Test history retained for audit.`);
