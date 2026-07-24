const CACHE="jornada-fb-google-cloud-v2-7-copa-clt-hub";
const FILES=["./","./index.html","./styles.css?v=2.7-copa-clt-hub","./app.js?v=2.7-copa-clt-hub","./config.js","./manifest.webmanifest","./icone-192.png","./icone-512.png","./icone-calculadora.svg","./apple-touch-icon.png","./mascot-panda.png","./mascot-pato.png","./mascot-coelha.png","./mascot-coruja.png"];

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
