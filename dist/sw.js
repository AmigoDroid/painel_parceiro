/* Service worker do Painel do Parceiro (instalação como app).
 * Estratégia deliberadamente mínima e segura:
 *  - Navegações: sempre rede primeiro (nada de HTML antigo após um deploy; convites e
 *    redefinição de senha nunca são servidos do cache). Sem rede, mostra /offline.html.
 *  - Todo o resto (JS/CSS com hash, imagens, API em outro domínio) passa direto,
 *    sem cache aqui: o cache HTTP normal do navegador/Nginx continua valendo.
 * Para forçar atualização do worker, mude VERSION. */
const VERSION = "v1";
const CACHE = `delta-parceiro-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/icon-192.png"])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("delta-parceiro-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.mode !== "navigate") return;
  event.respondWith(
    fetch(req).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error())
  );
});
