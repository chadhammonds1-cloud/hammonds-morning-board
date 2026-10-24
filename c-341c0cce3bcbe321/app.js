(function(){
'use strict';
var FOLDERS=['School','Personal','Information','Personal Finance','Work/Business','Projects - Art/Music/Tech','Utilities'];
var TZ='America/Chicago',open={};
var data=null,$=function(id){return document.getElementById(id)};
function ctDate(d){return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d||new Date())}
function key(id){return 'done:'+ctDate()+':'+id}
function isDone(id){try{return localStorage.getItem(key(id))==='1'}catch(e){return false}}
function setDone(id,v){try{v?localStorage.setItem(key(id),'1'):localStorage.removeItem(key(id))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;var d=new Date(s+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s}
function str(v){return typeof v==='string'&&v.trim()!==''}
function clean(j){
  var out=[],seen={},bad=0;
  var list=j&&Array.isArray(j.tasks)?j.tasks:[];
  list.forEach(function(t){
    if(!t||typeof t!=='object'||!str(t.id)||seen[t.id]||!str(t.title)||!str(t.bot)||
       !(t.due===null||t.due===undefined||(typeof t.due==='string'&&validDate(t.due)))||
       !(t.priority===1||t.priority===2||t.priority===3)||
       !(t.note===null||t.note===undefined||typeof t.note==='string')){bad++;return}
    seen[t.id]=1;
    out.push({id:t.id,title:t.title,bot:t.bot,folder:FOLDERS.indexOf(t.folder)>=0?t.folder:'Other',
      due:t.due||null,priority:t.priority,note:str(t.note)?t.note:null});
  });
  return {tasks:out,bad:bad};
}
function cmp(a,b){
  if(a.due!==b.due){if(!a.due)return 1;if(!b.due)return -1;return a.due<b.due?-1:1}
  if(a.priority!==b.priority)return a.priority-b.priority;
  return a.title.localeCompare(b.title);
}
function dueLabel(due,today){
  if(!due)return {c:'',t:'No date'};
  var f=new Date(due+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',weekday:'short',month:'short',day:'numeric'});
  if(due<today)return {c:'over',t:'Overdue · '+f};
  if(due===today)return {c:'today',t:'Due today'};
  return {c:'',t:'Due '+f};
}
var COLORS={};FOLDERS.concat(['Other']).forEach(function(f,i){COLORS[f]='var(--c'+i+')'});
var SV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">';
var ICONS={'School':'<path d="M3 9l9-5 9 5-9 5-9-5z"/><path d="M7 11.5V16c3 2 7 2 10 0v-4.5"/>','Personal':'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-6 8-6s7 1.5 8 6"/>',
 'Information':'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>','Personal Finance':'<path d="M12 3v18M16.5 7.5c-.8-1.5-2.5-2-4.5-2-2.5 0-4 1.2-4 3s1.5 2.6 4 3.2 4.5 1.3 4.5 3.3-1.8 3.2-4.5 3.2c-2.2 0-3.9-.8-4.6-2.4"/>',
 'Work/Business':'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>','Projects - Art/Music/Tech':'<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="15.5" cy="10" r="1"/><path d="M13 16.5a2 2 0 0 1 2-2h2"/>',
 'Utilities':'<path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>','Other':'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12h8"/>',
 'done':'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 10"/>'};
function icon(k){return SV+(ICONS[k]||ICONS.Other)+'</svg>'}
var CHEV='<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
function slug(f){return 'f-'+f.toLowerCase().replace(/[^a-z0-9]+/g,'-')}
function item(t,today){
  var d=dueLabel(t.due,today),done=isDone(t.id),cid='t-'+t.id.replace(/[^A-Za-z0-9_-]/g,'_'),sub=[];
  if(t.note)sub.push(esc(t.note));sub.push(esc(t.bot));sub.push('<span class="'+d.c+'">'+esc(d.t)+'</span>');
  return '<li class="'+(done?'done':'')+'"><input type="checkbox" id="'+esc(cid)+'" data-id="'+esc(t.id)+'"'+(done?' checked':'')+'>'+
    '<label class="t" for="'+esc(cid)+'"><div class="title">'+esc(t.title)+'</div><div class="sub">'+sub.join(' · ')+'</div></label></li>';
}
function render(){
  if(!data)return;
  var today=ctDate(),groups={},total=0,doneN=0,html='',rows='';
  data.tasks.forEach(function(t){(groups[t.folder]=groups[t.folder]||[]).push(t)});
  FOLDERS.concat(['Other']).forEach(function(f){
    var g=groups[f];if(!g)return;g.sort(cmp);
    var todo=g.filter(function(t){return !isDone(t.id)}),done=g.filter(function(t){return isDone(t.id)});
    total+=g.length;doneN+=done.length;
    html+='<section data-folder="'+esc(f)+'"><div class="label" id="'+slug(f)+'" style="color:'+(COLORS[f]||COLORS.Other)+'">'+esc(f)+'<small>'+done.length+' / '+g.length+'</small></div><ul class="todo">'+
      todo.map(function(t){return item(t,today)}).join('')+'</ul>';
    if(done.length)html+='<details data-f="'+esc(f)+'"'+(open[f]?' open':'')+'><summary>'+icon('done')+'Done today<span class="n">'+done.length+'</span>'+CHEV+'</summary><ul class="donelist">'+
      done.map(function(t){return item(t,today)}).join('')+'</ul></details>';
    html+='</section>';
    rows+='<a class="row" href="#'+slug(f)+'">'+icon(f)+esc(f)+'<span class="n">'+(g.length-done.length)+'</span>'+CHEV+'</a>';
  });
  $('list').innerHTML=html?html+'<h3>Folders</h3><nav class="folders">'+rows+'</nav>':'<p>No tasks.</p>';
  $('progress').textContent=doneN+' of '+total+' done';
  $('pbar').style.width=(total?Math.round(100*doneN/total):0)+'%';
  $('example').hidden=!data.example;
}
function setData(j,src){
  var c=clean(j);data={tasks:c.tasks,example:j.example===true,updated:j.updated};
  var u=new Date(j.updated);
  $('updated').textContent=isNaN(u)?'Updated ?':'Updated '+u.toLocaleString('en-US',{timeZone:TZ,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' CT';
  var m=[];if(c.bad)m.push(c.bad+' invalid task'+(c.bad>1?'s':'')+' skipped');if(src)m.push(src);
  msg(m.join(' · '));
  render();
}
function msg(t){$('msg').textContent=t;$('msg').hidden=!t}
// ---- encryption: tasks.enc.json = {v:1,kdf:'PBKDF2-SHA256',iter,salt,iv,ct} (base64). Decrypted tasks live in memory only.
var PASS_KEY='checklist-pass',ENC_COPY='tasks-enc-copy',enc=null,keyCache={};
try{localStorage.removeItem('tasks-copy')}catch(e){} // v1 kept a plaintext copy; never again
function b64(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function getPass(){try{return localStorage.getItem(PASS_KEY)}catch(e){return null}}
function deriveKey(pw,e){
  var id=e.salt+'|'+e.iter+'|'+pw;if(keyCache[id])return keyCache[id];
  var te=new TextEncoder();
  return keyCache[id]=crypto.subtle.importKey('raw',te.encode(pw),'PBKDF2',false,['deriveKey']).then(function(k){
    return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:b64(e.salt),iterations:e.iter},k,{name:'AES-GCM',length:256},false,['decrypt'])});
}
function decrypt(pw,e){
  if(!e||e.v!==1||e.kdf!=='PBKDF2-SHA256'||!(e.iter>=100000))return Promise.reject(new Error('format'));
  return deriveKey(pw,e).then(function(k){return crypto.subtle.decrypt({name:'AES-GCM',iv:b64(e.iv)},k,b64(e.ct))})
    .then(function(buf){return JSON.parse(new TextDecoder().decode(buf))});
}
function lock(err){
  data=null;$('list').innerHTML='';$('forget').hidden=true;$('forgethr').hidden=true;closeMenu();$('example').hidden=true;
  $('progress').textContent='Locked';$('pbar').style.width='0';msg('');
  document.body.classList.add('locked');$('lock').hidden=false;$('lockerr').textContent=err||'';$('lockerr').hidden=!err;
  $('unlock').disabled=false;$('pass').value='';setTimeout(function(){$('pass').focus()},50);
}
function unlocked(j,src){document.body.classList.remove('locked');$('lock').hidden=true;$('forget').hidden=false;$('forgethr').hidden=false;setData(j,src)}
function show(e,src){
  enc=e;if(e&&e.updated){var u=new Date(e.updated);if(!isNaN(u))$('updated').textContent='Updated '+u.toLocaleString('en-US',{timeZone:TZ,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' CT'}
  var pw=getPass();
  if(!pw){if($('lock').hidden)lock('');return}
  return decrypt(pw,e).then(function(j){unlocked(j,src)},function(){
    try{localStorage.removeItem(PASS_KEY)}catch(x){}
    lock('The saved passphrase no longer works (it may have been changed). Enter the current passphrase.');
  });
}
$('lock').addEventListener('submit',function(ev){
  ev.preventDefault();var pw=$('pass').value;if(!pw||!enc)return;
  $('unlock').disabled=true;$('lockerr').hidden=true;$('unlock').textContent='Unlocking…';
  decrypt(pw,enc).then(function(j){try{localStorage.setItem(PASS_KEY,pw)}catch(x){}$('pass').value='';unlocked(j,'')},
    function(){$('lockerr').textContent='Wrong passphrase. Try again.';$('lockerr').hidden=false;$('pass').select()})
  .then(function(){$('unlock').disabled=false;$('unlock').textContent='Unlock'});
});
$('forget').addEventListener('click',function(){closeMenu();try{localStorage.removeItem(PASS_KEY)}catch(x){}keyCache={};lock('')});
var loading=false;
function load(){
  if(loading)return;loading=true;
  fetch('tasks.enc.json?t='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})
  .then(function(e){try{localStorage.setItem(ENC_COPY,JSON.stringify(e))}catch(x){}return show(e,'')})
  .catch(function(){var s=null;try{s=JSON.parse(localStorage.getItem(ENC_COPY))}catch(x){}
    if(s)return show(s,'Offline — showing saved copy');msg('Could not load tasks')})
  .then(function(){loading=false},function(){loading=false});
}
var reduce=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false},pending=0;
$('list').addEventListener('change',function(e){var t=e.target;if(!t||!t.matches('input[data-id]'))return;
  var id=t.getAttribute('data-id');setDone(id,t.checked);
  if(reduce.matches||!t.checked){render();if(!t.checked&&!reduce.matches){var n=$('list').querySelector('ul.todo input[data-id="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');if(n)n.parentNode.classList.add('arrive')}return}
  t.classList.add('pop');t.parentNode.classList.add('leaving');pending++;
  setTimeout(function(){if(--pending===0)render()},320);  // bounce + fade/slide, then it lands in the collapsed Done today
});
$('list').addEventListener('toggle',function(e){var d=e.target;if(d&&d.tagName==='DETAILS')open[d.getAttribute('data-f')]=d.open},true);
function closeMenu(){$('menu').hidden=true;$('menubtn').setAttribute('aria-expanded','false')}
$('menubtn').addEventListener('click',function(e){e.stopPropagation();var o=$('menu').hidden;$('menu').hidden=!o;this.setAttribute('aria-expanded',String(o))});
document.addEventListener('click',function(e){if(!$('menu').hidden&&!e.target.closest('.menuwrap'))closeMenu()});
$('refresh').addEventListener('click',function(){closeMenu();load()});
// ---- theme: System (prefers-color-scheme) / Light / Dark, remembered in localStorage('theme')
var mq=window.matchMedia?matchMedia('(prefers-color-scheme: light)'):null;
function applyTheme(){
  var t='system';try{t=localStorage.getItem('theme')||'system'}catch(e){}
  if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme');
  var light=t==='light'||(t==='system'&&mq&&mq.matches);
  $('tc').setAttribute('content',light?'#f7f7f8':'#1c1c1e');
  [].forEach.call(document.querySelectorAll('#menu [data-theme]'),function(b){b.setAttribute('aria-checked',String(b.getAttribute('data-theme')===t))});
}
$('menu').addEventListener('click',function(e){var b=e.target.closest('[data-theme]');if(!b)return;
  try{localStorage.setItem('theme',b.getAttribute('data-theme'))}catch(x){}applyTheme()});
if(mq){if(mq.addEventListener)mq.addEventListener('change',applyTheme);else if(mq.addListener)mq.addListener(applyTheme)}
applyTheme();
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')load()});
window.addEventListener('pageshow',function(e){if(e.persisted)load()});
setInterval(render,60000); // picks up the CT midnight rollover while open
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(function(){});
load();
})();
