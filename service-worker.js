const CACHE="jornada-fb-google-cloud-v2-7-7-novos-mascotes-tema-unico";
const FILES=["./","./index.html","./styles.css?v=2.7.7-novos-mascotes-tema-unico","./app.js?v=2.7.7-novos-mascotes-tema-unico","./config.js","./manifest.webmanifest","./icone-192.png","./icone-512.png","./icone-calculadora.svg","./apple-touch-icon.png","./mascot-panda.webp","./mascot-pato.webp","./mascot-coelha.webp","./mascot-coruja.webp","./mascot-raposa.webp","./mascot-tubarao.webp","./mascot-dragao.webp","./mascot-gato.webp"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>
        caches.match(event.request).then(cached=>
          cached || (event.request.mode==="navigate" ? caches.match("./index.html") : undefined)
        )
      )
  );
});
