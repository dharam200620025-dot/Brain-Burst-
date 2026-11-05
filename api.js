/* ===== api: server calls, state, helpers ===== */
const KEY='bb_v1',$=s=>document.querySelector(s),
esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); 
let TOKEN='';try{TOKEN=sessionStorage.getItem('bb_t')||''}catch(e){}
const api=async(p,o={})=>{const r=await fetch('/api'+p,{method:o.method||'GET',headers:{'Content-Type':'application/json',...(TOKEN?{Authorization:'Bearer '+TOKEN}:{})},body:o.body&&JSON.stringify(o.body)}),j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Request failed');return j};
let DB={cats:[],quizzes:[],stats:{views:0,plays:0,done:0,score:0,shares:0},cfg:{ads:{on:false},pub:'',slot:'',timer:false,sec:15,user:''}};
const track=(type,quizId,score)=>fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,quizId,score}),keepalive:true}).catch(()=>{});
const save=()=>{if(S.auth)api('/admin/data',{method:'PUT',body:{cats:DB.cats,quizzes:DB.quizzes,cfg:DB.cfg}}).catch(e=>toast(e.message))};
const loadAll=async()=>{try{Object.assign(DB,await api(S.auth&&location.hash=='#admin'?'/admin/data':'/bootstrap'));S.timer=DB.cfg.timer}catch(e){if(S.auth){S.auth=false;TOKEN=''}}render()};
const S={mode:'home',cat:'All',diff:'All',q:'',tab:'dash',edit:null,del:null,rs:false,timer:DB.cfg.timer,auth:false,fails:0,run:null};
S.auth=!!TOKEN;
let TM;const stop=()=>clearInterval(TM);
const toast=t=>{const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2500)};
const norm=x=>{const q=(x.questions||x.q||[]).map(k=>({q:String(k.q||k.question||'').trim(),o:(k.o||k.options||[]).map(String),a:+(k.a??k.answer)})).filter(k=>k.q&&k.o.length>=2&&k.a>=0&&k.a<k.o.length),d=x.difficulty||x.d;
return{id:x.id||'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:String(x.title||x.t||'Untitled').slice(0,80),c:String(x.category||x.c||DB.cats[0]),d:['Easy','Medium','Hard'].includes(d)?d:'Easy',q,plays:+x.plays||0,done:+x.done||0}};
const upsert=n=>{if(!DB.cats.includes(n.c))DB.cats.push(n.c);const i=DB.quizzes.findIndex(x=>x.id==n.id);if(i<0)DB.quizzes.push(n);else{n.plays=DB.quizzes[i].plays;n.done=DB.quizzes[i].done;DB.quizzes[i]=n}};

