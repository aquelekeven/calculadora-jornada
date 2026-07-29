const CACHE = "jornada-fb-static-v2-9-edit-history";
const SCOPE = self.registration.scope;
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css?v=2.9-edicao-historico",
  "./app.js?v=2.9-edicao-historico",
  "./theme-bootstrap.js",
  "./manifest.webmanifest",
  "./icone-192.png",
  "./icone-512.png",
  "./icone-calculadora.svg",
  "./apple-touch-icon.png",
  "./mascot-panda.webp",
  "./mascot-pato.webp",
  "./mascot-coelha.webp",
  "./mascot-coruja.webp",
  "./mascot-raposa.webp",
  "./mascot-tubarao.webp",
  "./mascot-dragao.webp",
  "./mascot-gato.webp"
];

const STATIC_URLS = new Set(
  PRECACHE.map((path) => {
    const url = new URL(path, SCOPE);
    url.search = "";
    return url.href;
  })
);

function normalizedUrl(request) {
  const url = new URL(request.url);
  url.search = "";
  return url.href;
}

function isPrivateOrDynamicRequest(request) {
  const url = new URL(request.url);
  return (
    url.origin !== self.location.origin ||
    request.headers.has("authorization") ||
    request.headers.has("apikey") ||
    /\/auth\/v1\//.test(url.pathname) ||
    /\/rest\/v1\//.test(url.pathname) ||
    /\/functions\/v1\//.test(url.pathname) ||
    /\/realtime\/v1\//.test(url.pathname) ||
    url.pathname.endsWith("/config.js")
  );
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const cache = await caches.open(CACHE);
      await cache.put(new URL("./index.html", SCOPE), response.clone());
    }
    return response;
  } catch {
    return (
      await caches.match(new URL("./index.html", SCOPE)) ||
      await caches.match(new URL("./", SCOPE))
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const update = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || update;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("jornada-fb-") && key !== CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || isPrivateOrDynamicRequest(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (STATIC_URLS.has(normalizedUrl(request))) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CLEAR_RUNTIME_DATA") return;
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("jornada-fb-"))
          .map((key) => caches.delete(key))
      )
    )
  );
});
