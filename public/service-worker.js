const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/styles.css",
    "/index.js",
    "/db.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// install
self.addEventListener("install", function (evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully!");
            cache.addAll(FILES_TO_CACHE).then(() => {
                self.skipWaiting()
            });
        }),
    );
});

self.addEventListener("activate", event => {
    const currentCaches = [CACHE_NAME, DATA_CACHE_NAME];
    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => {
                // return array of cache names that are old to delete
                return cacheNames.filter(
                    cacheName => !currentCaches.includes(cacheName),
                );
            })
            .then(cachesToDelete => {
                return Promise.all(
                    cachesToDelete.map(cacheToDelete => {
                        return caches.delete(cacheToDelete);
                    }),
                );
            })
            .then(() => self.clients.claim()),
    );
});

// fetch
self.addEventListener("fetch", function (evt) {
    if (evt.request.url.includes("/api/")) {
        evt.respondWith(
            caches
                .open(DATA_CACHE_NAME)
                .then(cache => {
                    console.log(evt.request)
                    return fetch(evt.request)

                        .then(response => {

                            if (response.status === 200) {
                                cache.put(evt.request.url, response.clone());
                            }

                            return response;
                        })
                        .catch(err => {
                            return cache.match(evt.request);
                        });
                })
                .catch(err => console.log(err)),
        );

        return;
    }
    evt.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(evt.request).then(response => {
                return response || fetch(evt.request);
            });
        }),
    );
});
