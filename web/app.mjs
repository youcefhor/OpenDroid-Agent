import {Simulator,Runner,planCommand,validatePlan} from './engine.mjs';
const $=id=>document.getElementById(id), sim=new Simulator();
let mode='sim',busy=false,entries=[],plan=[],approvedResolve=null,timer=null,start=0,sessionToken='',deviceConnected=false;
const counts={completed:0,verified:0,retries:0};
const appNames={home:'الرئيسية',settings:'الإعدادات',browser:'المتصفح',notes:'الملاحظات',messages:'الرسائل'};
function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function log(title,detail='',kind='info'){
 const item={time:new Date().toISOString(),title,detail,kind,mode};entries.push(item);
 if(entries.length>300)entries.shift();if($('logs').querySelector('.welcome'))$('logs').replaceChildren();
 const row=node('div',undefined,'log '+kind);row.append(node('span',kind==='error'?'!':kind==='success'?'✓':'↳','log-symbol'));
 const body=node('div');body.append(node('strong',title),node('small',detail));row.append(body,node('time',new Date().toLocaleTimeString('en-GB',{hour12:false})));$('logs').append(row);if($('logs').children.length>300)$('logs').firstChild.remove();$('logs').scrollTop=$('logs').scrollHeight;
}
function status(text){$('status').textContent=text;}
function renderPhone(){
 if(mode!=='sim')return;
 const s=sim.state,c=$('phoneContent');c.replaceChildren();$('screen').classList.toggle('dark-screen',s.dark&&s.app!=='home');
 const title=node('h3',appNames[s.app],'phone-title');
 if(s.app==='home'){
  const clock=node('div',undefined,'home-time');clock.append(node('strong','09:41'),node('span','الأحد، يوم جديد للتجربة'),node('small','☀ 24° · عالمك الافتراضي'));c.append(clock);
  const grid=node('div',undefined,'app-grid');for(const [app,icon]of [['settings','⚙'],['browser','◉'],['notes','▤'],['messages','▣']]){const b=node('button',undefined,'app-icon');b.append(node('b',icon),node('span',appNames[app]));b.onclick=()=>{if(!busy){sim.state.app=app;renderPhone();log('تفاعل يدوي','فتح '+appNames[app]);}};grid.append(b);}c.append(grid);
  const widget=node('div',undefined,'home-widget');widget.append(node('strong','مرحباً بك في OpenDroid'),node('span','هذا الهاتف مساحة آمنة لتجربة الوكيل.'));c.append(widget);return;
 }
 c.append(title);
 if(s.app==='settings'){
  c.append(node('div','جهاز افتراضي · Android','phone-card'));
  for(const [key,label]of [['wifi','Wi-Fi'],['dark','المظهر الداكن']]){const row=node('div',undefined,'setting');row.append(node('span',label));const t=node('button',undefined,'toggle '+(s[key]?'on':''));t.setAttribute('aria-label',label);t.setAttribute('role','switch');t.setAttribute('aria-checked',String(s[key]));t.disabled=busy;t.append(node('i'));t.onclick=()=>{s[key]=!s[key];renderPhone();};row.append(t);c.append(row);}
  c.append(node('div','التغييرات تطبق داخل هذه المحاكاة فقط.','phone-card'));
 }else if(s.app==='browser'){
  const input=node('input',undefined,'phone-input');input.placeholder='ابحث في النتائج التجريبية';input.value=s.query;input.setAttribute('aria-label','بحث الهاتف الافتراضي');input.disabled=busy;
  input.onchange=()=>{s.query=input.value;renderPhone();};c.append(input,node('p','نتائج مصممة للمحاكاة · ليست بحثاً حياً','help'));
  if(s.query)for(const title of [s.query+' — ابدأ الاكتشاف','دليل المشاريع المفتوحة','تعلّم، جرّب، ثم ابنِ']){const r=node('div',undefined,'search-result');r.append(node('strong',title),node('small','مثال محلي لعرض نتيجة تنفيذ البحث'));c.append(r);}
 }else if(s.app==='notes'){
  const input=node('input',undefined,'phone-input');input.placeholder='ملاحظة جديدة…';input.setAttribute('aria-label','ملاحظة الهاتف الافتراضي');input.maxLength=500;input.disabled=busy;c.append(input);
  const b=node('button','+ حفظ الملاحظة','phone-button');b.disabled=busy;b.onclick=()=>{if(input.value.trim()){s.notes.push(input.value.trim());renderPhone();}};c.append(b);
  if(!s.notes.length)c.append(node('div','لا توجد ملاحظات بعد. دع الوكيل يكتب أول ملاحظة.','phone-card'));
  for(const text of s.notes)c.append(node('div',text,'phone-card'));
 }else if(s.app==='messages'){
  c.append(node('div','محادثة تجريبية · لا يوجد مستلم حقيقي','phone-card'));
  for(const text of s.sent)c.append(node('div',text,'phone-card'));
  const draft=node('div',s.draft||'المسودة فارغة','phone-card');draft.append(node('small','مسودة · لن تُرسل بلا موافقتك'));c.append(draft);
 }
}
function renderPlan(p){plan=p;$('stepCount').textContent=p.length+' إجراءات';$('plan').replaceChildren();p.forEach((s,i)=>{const li=node('li');li.id='step-'+i;li.append(node('span',String(i+1).padStart(2,'0'),'num'));const detail=node('span',s.label);if(s.value!==undefined)detail.append(node('small',' · '+(typeof s.value==='boolean'?(s.value?'تشغيل':'إيقاف'):s.value)));li.append(detail);if(s.sensitive)li.append(node('span','◇'));$('plan').append(li);});}
async function approve(step,real=false){
 $('approvalText').textContent=real?'سيُنفذ هذا الإجراء على هاتف Android الحقيقي المتصل: '+step.label+'. الموافقة تخص هذه الخطة فقط.':step.label+' داخل الهاتف الافتراضي فقط. '+(step.action==='send'?'نص الرسالة: «'+sim.state.draft+'»':step.action==='delete'?'سيُحذف '+sim.state.notes.length+' من الملاحظات التجريبية.':'هل توافق على المتابعة؟');
 $('approval').showModal();return new Promise(resolve=>{approvedResolve=resolve;});
}
function resolveApproval(value){$('approval').close();if(approvedResolve){approvedResolve(value);approvedResolve=null;}}
$('approve').onclick=()=>resolveApproval(true);$('reject').onclick=()=>resolveApproval(false);$('approval').addEventListener('cancel',e=>{e.preventDefault();resolveApproval(false);});
function event(e){
 const row=$('step-'+e.index);
 if(e.type==='step'){row?.classList.add('running');status('جارٍ التنفيذ');$('pointer').hidden=false;log(e.step.label,typeof e.step.value==='string'?e.step.value:'تنفيذ في المحاكاة');}
 if(e.type==='approval'){status('بانتظار موافقتك');log('توقف للموافقة','الإجراء لن ينفذ حتى توافق');}
 if(e.type==='retry'){counts.retries++;log('إعادة محاولة آمنة',e.message);}
 if(e.type==='verify'){status('التحقق من النتيجة');}
 if(e.type==='done'){counts.completed++;counts.verified++;row?.classList.replace('running','done');if(row)row.querySelector('.num').textContent='✓';renderPhone();log('تم التحقق',plan[e.index].label,'success');$('progressBar').style.width=(counts.completed/plan.length*100)+'%';}
 if(e.type==='complete'){status('اكتملت المهمة بنجاح');log('اكتملت المهمة',e.completed+' إجراءات منفذة ومتحققة','success');}
 if(e.type==='error'){status('توقفت المهمة');document.querySelector('.plan .running')?.classList.replace('running','failed');log('توقفت المهمة',e.message,'error');}
 for(const key of Object.keys(counts))$(key).textContent=counts[key];
}
const runner=new Runner(sim,{event,approve});
function setBusy(value){busy=value;$('run').disabled=value;$('stop').disabled=!value;$('simTab').disabled=value;$('adbTab').disabled=value;$('command').disabled=value;$('connect').disabled=value;document.querySelectorAll('[data-command],.phone button,details input').forEach(e=>e.disabled=value);$('pointer').hidden=!value;if(value){start=Date.now();timer=setInterval(()=>$('elapsed').textContent=new Date(Date.now()-start).toISOString().slice(14,19),200);}else{clearInterval(timer);renderPhone();}}
async function api(path,body){
 const response=await fetch(path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-OpenDroid-Token':sessionToken},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const data=await response.json().catch(()=>{throw Error('هذه الوظيفة تحتاج خادم OpenDroid المحلي؛ الاستضافة العامة تدعم المحاكاة.');});
 if(!response.ok)throw Error(data.error||'فشل اتصال الخادم');return data;
}
async function run(){
 if(busy)return;setBusy(true);Object.keys(counts).forEach(k=>{counts[k]=0;$(k).textContent='0';});$('progressBar').style.width='0%';
 try{
 if(mode==='adb'){
  if(!deviceConnected)throw Error('اتصل بالخادم المحلي وهاتف ADB أولاً');
  const result=await api('/api/device/plan',{command:$('command').value});renderPlan(result.steps);log('خطة تحكم حقيقي',result.description);
  if(!await approve({label:result.description},true))throw Error('ألغيت الموافقة؛ لم ينفذ شيء');
  status('تنفيذ على الجهاز الحقيقي');const outcome=await api('/api/device/execute',{approval_id:result.approval_id});
  counts.completed=outcome.completed;counts.verified=outcome.verified;$('completed').textContent=counts.completed;$('verified').textContent=counts.verified;$('progressBar').style.width='100%';
  showReal(outcome);status(outcome.verified?'اكتمل وتم التحقق من الجهاز':'نُفذ الإجراء؛ تحقق بصري مطلوب');log('نتيجة الجهاز الحقيقي',outcome.message,'success');return;
 }
 let p;if($('ai').checked){const data=await api('/api/plan',{command:$('command').value});p=validatePlan(data.steps);log('تفسير AI','النص أرسل إلى النموذج المعد على خادمك');}else p=planCommand($('command').value);
 renderPlan(p);if(matchMedia('(max-width:650px)').matches)document.querySelector('.device-panel').scrollIntoView({behavior:'smooth',block:'start'});log('الخطة جاهزة',p.length+' إجراءات · '+($('ai').checked?'تفسير AI':'تفسير محلي محدود'));
 sim.failNext=$('fault').checked;await runner.run(p);
 }catch(e){if(!entries.length||entries.at(-1).detail!==e.message){status('تعذر إكمال المهمة');log('خطأ',e.message,'error');}}
 finally{setBusy(false);}
}
function showReal(data){const c=$('phoneContent');c.replaceChildren();if(data.screenshot){const img=node('img',undefined,'real-shot');img.alt='لقطة فعلية من جهاز Android المتصل';img.src='data:image/png;base64,'+data.screenshot;c.append(img);}else c.append(node('div','جهاز متصل. شغّل أمراً لالتقاط الشاشة.','real-placeholder'));}
$('run').onclick=run;$('stop').onclick=()=>{if(mode==='sim'){runner.cancel();resolveApproval(false);log('طلب إيقاف','ستتوقف المهمة قبل الإجراء التالي');}else log('إجراء ADB قيد التنفيذ','الأمر الحقيقي الحالي لا يمكن التراجع عنه؛ لن تبدأ مهمة جديدة.');};
$('command').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')run();});
for(const b of document.querySelectorAll('[data-command]'))b.onclick=()=>{$('command').value=b.dataset.command;run();};
function setMode(value){mode=value;deviceConnected=false;$('simTab').setAttribute('aria-selected',String(value==='sim'));$('adbTab').setAttribute('aria-selected',String(value==='adb'));$('simNotice').hidden=value!=='sim';$('adbPanel').hidden=value!=='adb';$('examples').hidden=value!=='sim';$('modeBadge').textContent=value==='sim'?'SIMULATION':'ADB · NOT CONNECTED';$('phoneCaption').textContent=value==='sim'?'OpenDroid Virtual · تفاعلي':'ADB · غير متصل';$('screen').classList.remove('dark-screen');$('command').value=value==='sim'?'افتح الإعدادات وشغّل الواي فاي والمظهر الداكن':'افتح الإعدادات';if(value==='sim')renderPhone();else{$('phoneContent').replaceChildren(node('div','⌁\nوضع جهاز حقيقي\nلا توجد صورة محاكاة هنا.\nاتصل بالخادم المحلي لعرض هاتفك.','real-placeholder'));}log('تغيير وضع التشغيل',value==='sim'?'محاكاة محلية':'ADB حقيقي · اتصال مطلوب');}
$('simTab').onclick=()=>setMode('sim');$('adbTab').onclick=()=>setMode('adb');
$('connect').onclick=async()=>{sessionToken=$('sessionToken').value||sessionToken;$('sessionToken').value='';try{const data=await api('/api/device');deviceConnected=true;$('deviceStatus').textContent='متصل: '+data.serial;$('modeBadge').textContent='ADB · CONNECTED';$('phoneCaption').textContent='Android حقيقي · '+data.serial;showReal(data);log('ADB متصل',data.serial);}catch(e){deviceConnected=false;$('deviceStatus').textContent=e.message;log('تعذر الاتصال',e.message,'error');}};
for(const b of document.querySelectorAll('[data-nav]'))b.onclick=()=>{if(!busy&&mode==='sim'){sim.state.app='home';renderPhone();}};
$('clear').onclick=()=>{entries=[];$('logs').replaceChildren();};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({product:'OpenDroid Studio',mode,entries},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='opendroid-session.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
if(location.hash.startsWith('#token=')){sessionToken=decodeURIComponent(location.hash.slice(7));history.replaceState(null,'',location.pathname+location.search);}
renderPhone();
