/* Pure planning and execution core. No DOM, network or model required. */
export const initialState = () => ({app:'home',wifi:false,dark:false,query:'',notes:[],draft:'',sent:[],deleted:0});
const labels={open:'فتح التطبيق',wifi:'تغيير Wi-Fi',dark:'تغيير المظهر',search:'كتابة البحث',note:'حفظ الملاحظة',draft:'كتابة المسودة',send:'إرسال الرسالة التجريبية',delete:'حذف الملاحظات التجريبية',home:'العودة للرئيسية'};
const apps=['settings','browser','notes','messages'];
export function validatePlan(plan){
 if(!Array.isArray(plan)||!plan.length||plan.length>20) throw Error('خطة غير صالحة: يجب أن تحتوي 1–20 إجراء');
 return plan.map(s=>{
  if(!s||typeof s!=='object'||!Object.hasOwn(labels,s.action)||Object.keys(s).some(k=>!['action','value'].includes(k))) throw Error('إجراء غير مسموح');
  if(s.action==='open'&&!apps.includes(s.value)) throw Error('تطبيق غير مدعوم');
  if(['wifi','dark'].includes(s.action)&&typeof s.value!=='boolean') throw Error('قيمة الإعداد غير صالحة');
  if(['search','note','draft'].includes(s.action)&&(typeof s.value!=='string'||!s.value.trim()||s.value.length>500)) throw Error('نص الإجراء غير صالح');
  if(['send','delete','home'].includes(s.action)&&s.value!==undefined) throw Error('معامل غير متوقع');
  return {...s,label:labels[s.action],sensitive:['send','delete'].includes(s.action)};
 });
}
export function planCommand(raw){
 const text=raw.trim(); if(!text||text.length>1000) throw Error('اكتب أمراً بين حرف واحد و1000 حرف');
 const n=text.replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
 const quoted=text.match(/[«"“](.+?)[»"”]/)?.[1];
 let p;
 if(/احذف|امسح|delete/.test(n)) p=[{action:'open',value:'notes'},{action:'delete'}];
 else if(/ارسل|send/.test(n)) p=[{action:'open',value:'messages'},{action:'draft',value:quoted||'مرحباً، هذه رسالة من OpenDroid'},{action:'send'}];
 else if(/ملاحظ|ملاحظه|note/.test(n)) p=[{action:'open',value:'notes'},{action:'note',value:quoted||'فكرتي القادمة تبدأ بخطوة صغيرة.'}];
 else if(/ابحث|بحث|search/.test(n)) p=[{action:'open',value:'browser'},{action:'search',value:quoted||text.replace(/^.*?(ابحث عن|ابحث|بحث عن|search for|search)/i,'').trim()||'Android open source'}];
 else if(/واي|wifi|wi-fi|داكن|ليلي|dark|اعدادات/.test(n)) {
 p=[{action:'open',value:'settings'}];
 if(/واي|wifi|wi-fi/.test(n))p.push({action:'wifi',value:!/اطف|اوقف|عطل|off/.test(n)});
 if(/داكن|ليلي|dark/.test(n))p.push({action:'dark',value:!/فاتح|الغ|light/.test(n)});
 } else if(/الرئيسي|home/.test(n))p=[{action:'home'}];
 else if(/متصفح|browser/.test(n))p=[{action:'open',value:'browser'}];
 else throw Error('لم أفهم هذا الأمر ضمن المحاكاة. جرّب أحد الأمثلة، أو استخدم مفسّر AI محلياً.');
 return validatePlan(p);
}
export class Simulator{
 constructor(){this.state=initialState();this.failNext=false;}
 async execute(s){
  if(this.failNext){this.failNext=false;const e=Error('انقطاع تجريبي قبل التنفيذ');e.retryable=true;throw e;}
  const st=this.state;
  if(s.action==='open')st.app=s.value;
  if(s.action==='home')st.app='home';
  if(['wifi','dark'].includes(s.action)){if(st.app!=='settings')throw Error('الإعدادات غير مفتوحة');st[s.action]=s.value;}
  if(s.action==='search'){if(st.app!=='browser')throw Error('المتصفح غير مفتوح');st.query=s.value;}
  if(s.action==='note'){if(st.app!=='notes')throw Error('الملاحظات غير مفتوحة');st.notes.push(s.value);}
  if(s.action==='draft'){if(st.app!=='messages')throw Error('الرسائل غير مفتوحة');st.draft=s.value;}
  if(s.action==='send'){if(st.app!=='messages'||!st.draft)throw Error('لا توجد مسودة لإرسالها');st.sent.push(st.draft);st.draft='';}
  if(s.action==='delete'){if(st.app!=='notes')throw Error('الملاحظات غير مفتوحة');st.deleted+=st.notes.length;st.notes=[];}
  return structuredClone(st);
 }
 verify(s,before){const st=this.state;
  if(s.action==='open')return st.app===s.value;
  if(s.action==='home')return st.app==='home';
  if(['wifi','dark'].includes(s.action))return st[s.action]===s.value;
  if(s.action==='search')return st.query===s.value;
  if(s.action==='note')return st.notes.length===before.notes.length+1&&st.notes.at(-1)===s.value;
  if(s.action==='draft')return st.draft===s.value;
  if(s.action==='send')return st.sent.length===before.sent.length+1&&st.sent.at(-1)===before.draft;
  return s.action==='delete'&&st.notes.length===0;
 }
}
export class Runner{
 constructor(adapter,{event=()=>{},approve=async()=>false,delay=ms=>new Promise(r=>setTimeout(r,ms))}={}){this.adapter=adapter;this.event=event;this.approve=approve;this.delay=delay;this.busy=false;this.cancelled=false;}
 cancel(){this.cancelled=true;}
 async run(input){
  if(this.busy)throw Error('هناك مهمة قيد التنفيذ');
  const plan=validatePlan(input.map(({action,value})=>value===undefined?{action}:{action,value}));
  this.busy=true;this.cancelled=false;let completed=0;
  try{for(let i=0;i<plan.length;i++){
   if(this.cancelled)throw Error('تم إيقاف المهمة');const step=plan[i];this.event({type:'step',index:i,step});
   if(step.sensitive){this.event({type:'approval',index:i});if(!await this.approve(step))throw Error('لم تتم الموافقة على الإجراء');}
   if(this.cancelled)throw Error('تم إيقاف المهمة');
   const before=structuredClone(this.adapter.state);let attempt=0;
   while(true){try{await this.adapter.execute(step);break;}catch(e){if(!e.retryable||attempt++>=1)throw e;this.event({type:'retry',index:i,message:e.message});await this.delay(350);if(this.cancelled)throw Error('تم إيقاف المهمة');}}
   this.event({type:'verify',index:i});if(!await this.adapter.verify(step,before))throw Error('فشل التحقق من النتيجة؛ تم إيقاف المهمة');
   completed++;this.event({type:'done',index:i,state:structuredClone(this.adapter.state)});await this.delay(650);
  }this.event({type:'complete',completed});return {completed};}
  catch(e){this.event({type:'error',message:e.message,completed});throw e;}finally{this.busy=false;}
 }
}
