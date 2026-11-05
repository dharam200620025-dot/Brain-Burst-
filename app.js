/* ===== app: render, events, boot ===== */
function render(){const a=location.hash=='#admin';$('#app').innerHTML=head(a)+(a?(S.auth?panel():login()):S.mode=='play'?play():S.mode=='result'?result():home());adsInit()}
const act={
home(){stop();S.mode='home';S.run=null;render()},
cat(v){S.cat=v;render()},diff(v){S.diff=v;render()},
start(id){const z=DB.quizzes.find(x=>x.id==id);if(!z||!z.q.length)return;z.plays=(z.plays||0)+1;track('play',z.id);S.run={z,i:0,ok:0,bad:0,ans:null,t:DB.cfg.sec};S.mode='play';render();scrollTo(0,0);tick()},
pick(v){pick(+v)},
next(){const r=S.run;r.i++;r.ans=null;r.t=DB.cfg.sec;if(r.i>=r.z.q.length){stop();const n=r.z.q.length;r.z.done=(r.z.done||0)+1;track('done',r.z.id,r.ok/n*100);S.mode='result';render();scrollTo(0,0)}else{render();tick()}},
shr(){track('share')},
tab(v){S.tab=v;S.edit=null;S.del=null;if(v=='dash')loadAll();else render()},
logout(){S.auth=false;TOKEN='';try{sessionStorage.removeItem('bb_t')}catch(e){}loadAll()},
async login(){try{const j=await api('/login',{method:'POST',body:{user:$('#u').value.trim(),password:$('#p').value}});TOKEN=j.token;try{sessionStorage.setItem('bb_t',TOKEN)}catch(e){}S.auth=true;await loadAll()}catch(e){toast(e.message)}},
new(){S.edit='new';render()},edit(id){S.edit=id;render()},cancel(){S.edit=null;render()},
saveq(){let q;try{q=JSON.parse($('#fq').value)}catch(e){return toast('Questions JSON is invalid')}const n=norm({title:$('#ft').value.trim()||'Untitled',category:$('#fc').value,difficulty:$('#fd').value,questions:q,id:S.edit=='new'?null:S.edit});if(!n.q.length)return toast('Add at least one valid question');upsert(n);S.edit=null;save();render();toast('Quiz saved')},
del(id){if(S.del==id){DB.quizzes=DB.quizzes.filter(x=>x.id!=id);S.del=null;save()}else S.del=id;render()},
ac(){const n=$('#nc').value.trim();if(n&&!DB.cats.includes(n)){DB.cats.push(n);save()}render()},
rc(c){if(DB.quizzes.some(z=>z.c==c))return toast('Move or delete its quizzes first');DB.cats=DB.cats.filter(x=>x!=c);save();render()},
imp(){let a;try{a=JSON.parse($('#imp').value)}catch(e){return toast('Invalid JSON')}a=(Array.isArray(a)?a:[a]).map(x=>norm(x)).filter(n=>n.q.length);a.forEach(n=>upsert(n));save();render();toast(`Imported ${a.length} quiz(es)`)},
exp(){$('#imp').value=JSON.stringify(DB.quizzes.map(z=>({title:z.t,category:z.c,difficulty:z.d,questions:z.q})),null,1);toast('Exported to the box — copy it')},
ids(){DB.cfg.pub=$('#pub').value.trim();DB.cfg.slot=$('#slot').value.trim();save();toast('Ad IDs saved')},
async cred(){try{await api('/admin/password',{method:'POST',body:{user:$('#nu').value.trim(),password:$('#np').value}});toast('Login updated')}catch(e){toast(e.message)}},
async reset(){if(S.rs){S.rs=false;try{await api('/admin/reset',{method:'POST'});await loadAll();toast('Demo data restored')}catch(e){toast(e.message)}}else{S.rs=true;render()}}};
const chg={timer(t){S.timer=t.checked},ad(t){DB.cfg.ads[t.dataset.v]=t.checked;save()},tm(t){DB.cfg.timer=t.checked;save()},sec(t){DB.cfg.sec=+t.value;save()},file(t){const f=t.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('#imp').value=r.result};r.readAsText(f)}};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(t&&act[t.dataset.a])act[t.dataset.a](t.dataset.v,t)});
document.addEventListener('change',e=>{const t=e.target.closest('[data-c]');if(t&&chg[t.dataset.c])chg[t.dataset.c](t)});
document.addEventListener('input',e=>{if(e.target.id=='sq'){S.q=e.target.value;$('#grid').innerHTML=grid()}});
document.addEventListener('keydown',e=>{if(e.key=='Enter'&&e.target.id=='p')act.login()});
addEventListener('hashchange',()=>{stop();loadAll()});
setInterval(()=>{if(S.auth&&location.hash=='#admin'&&S.tab=='dash')loadAll()},10000);
if(location.hash!='#admin')track('view');
loadAll();
