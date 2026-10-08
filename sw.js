const CACHE_NAME = "gummyware-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];

/* =========================================================
   INSTALACIÓN
========================================================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(cache =>
          cache.addAll(APP_SHELL)
        )
        .then(() =>
          self.skipWaiting()
        )
    );

  }
);

/* =========================================================
   ACTIVACIÓN
========================================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches.keys()
        .then(keys =>
          Promise.all(
            keys
              .filter(
                key =>
                  key !== CACHE_NAME
              )
              .map(
                key =>
                  caches.delete(key)
              )
          )
        )

        .then(() =>
          self.clients.claim()
        )

    );

  }
);

/* =========================================================
   PETICIONES
========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;

    if (
      request.method !== "GET"
    ) {
      return;
    }

    const url =
      new URL(request.url);

    /*
      Los videos NO se guardan en caché.
      Así evitamos que GitHub entregue
      un video viejo.
    */

    if (
      url.pathname.endsWith(".mp4")
    ) {
      return;
    }

    /*
      Recursos externos, como Google Fonts,
      no los controlamos desde este SW.
    */

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    /*
      NETWORK FIRST

      Primero intenta obtener la versión
      actual de GitHub.

      Si no hay Internet, usa la versión
      guardada.
    */

    event.respondWith(

      fetch(request)

        .then(response => {

          if (
            response &&
            response.status === 200
          ) {

            const copy =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache => {
                cache.put(
                  request,
                  copy
                );
              });

          }

          return response;
        })

        .catch(() =>
          caches
            .match(request)
            .then(cached =>
              cached ||
              caches.match(
                "./index.html"
              )
            )
        )

    );

  }
);
