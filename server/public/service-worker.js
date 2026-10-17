const CACHE = "expense-tracker-v1";
const FILES = ["/", "/style.css", "/script.js", "/manifest.json", "/icon-192.png"];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE).then(function (cache) {
            return cache.addAll(FILES);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys
                .filter(function (key) {
                    return key !== CACHE;
                })
                .map(function (key) {
                    return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", function (event) {
    const url = new URL(event.request.url);

    if (
        event.request.method !== "GET" ||
        url.origin !== location.origin ||
        url.pathname.startsWith("/api/")
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                const copy  = response.clone();
                caches.open(CACHE).then(function (cache) {
                    cache.put(event.request, copy);
                });
                return response;
            })
            .catch(function () {
                return caches.match(event.request);
            })
    );
});