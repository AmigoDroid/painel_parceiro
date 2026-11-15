// Registra o service worker (necessário para o Chrome oferecer "Instalar app").
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(function (e) {
      console.warn("[delta-partner] service worker não registrado", e);
    });
  });
}
