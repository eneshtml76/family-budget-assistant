const CACHE_NAME = "family-budget-v1.3-shell-1";
const APP_SHELL = [
    "./",
    "./index.html",
    "./css/foundation.css",
    "./css/layout.css",
    "./css/budget-guide.css",
    "./css/features.css",
    "./css/dark-theme.css",
    "./css/release-ui.css",
    "./js/app.js",
    "./js/core/dom.js",
    "./js/core/state.js",
    "./js/core/categories.js",
    "./js/core/formatting.js",
    "./js/features/analytics.js",
    "./js/features/authentication.js",
    "./js/features/backup.js",
    "./js/features/chart.js",
    "./js/features/family-guide.js",
    "./js/features/loan-simulator.js",
    "./js/features/savings-goals.js",
    "./js/features/transactions.js",
    "./js/services/api.js",
    "./js/ui/app-installation.js",
    "./js/ui/language.js",
    "./js/ui/theme.js",
    "./manifest.webmanifest",
    "./icons/app-icon.svg",
    "./icons/app-icon-180.png",
    "./icons/app-icon-192.png",
    "./icons/app-icon-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName.startsWith("family-budget-") && cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const responseCopy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", responseCopy));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request).then((cachedResponse) =>
                    cachedResponse || caches.match("./index.html")
                ))
        );
        return;
    }

    if (/\.(js|css|webmanifest)$/.test(requestUrl.pathname)) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const responseCopy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((response) => {
                if (response.ok) {
                    const responseCopy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
                }
                return response;
            });
        })
    );
});
