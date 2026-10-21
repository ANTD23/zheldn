// Железный дневник — офлайн-кэш. При изменении этого файла увеличьте номер версии.
const CACHE='ironlog-v2';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  const ours=u.origin===self.location.origin, fonts=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(!ours&&!fonts) return;
  const key=r.mode==='navigate'?'./index.html':r;
  // Сначала из кэша (быстро и без сети), параллельно обновляем кэш из сети.
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(key,{ignoreSearch:true});
    const net=fetch(r).then(res=>{ if(res&&(res.ok||res.type==='opaque')) c.put(key,res.clone()); return res; }).catch(()=>null);
    if(hit){ e.waitUntil(net); return hit; }
    return (await net)||new Response('Нет сети',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));
});
