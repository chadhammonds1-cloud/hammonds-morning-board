// Shell cached on install (cache-first); tasks.enc.json (ciphertext only) is network-first with cached fallback.
var V='checklist-v2',SHELL=['./','index.html','app.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  if(/\/tasks\.enc\.json$/.test(u.pathname)){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(function(r){if(r.ok){var cp=r.clone();caches.open(V).then(function(c){c.put('tasks.enc.json',cp)})}return r})
      .catch(function(){return caches.match('tasks.enc.json')}));return;}
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(function(r){var cp=r.clone();caches.open(V).then(function(c){c.put('index.html',cp)});return r}).catch(function(){return caches.match('index.html')}));return;}
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(function(r){return r||fetch(e.request)}));
});
