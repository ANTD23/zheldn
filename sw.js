// Железный дневник — офлайн-кэш. При изменении этого файла увеличьте номер версии.
// 18.11.2026: удаляются только свои старые копии (ironlog-). На github.io хранилище общее для всех
// программ аккаунта — раньше обновление дневника стирало копии Круговой борьбы и других программ.
const CACHE='ironlog-v17';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('ironlog-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
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
    const res=await net; if(res) return res; if(fonts) return new Response('',{status:200,headers:{'Content-Type':u.hostname==='fonts.googleapis.com'?'text/css':'font/woff2'}}); if(r.mode==='navigate'){ const any=await c.match('./index.html'); if(any) return any; } return new Response('Нет сети',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));
});
