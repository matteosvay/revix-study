/**
 * Revix Service Worker — Offline-first for static assets, network-first for API.
 *
 * Strategy:
 * - Static assets (JS, CSS, images, fonts): Cache-first with fallback to network.
 * - API / Supabase calls: Network-first with short timeout, then cache fallback.
 * - Navigation (HTML): Network-first, falls back to cached /app shell.
 * - AI edge functions: Network-only (no caching — dynamic content).
 */

const CACHE_NAME = "revix-v1";
const SHELL_CACHE = "revix-shell-v1";

// Core app shell files to pre-cache on install
const PRECACHE_URLS = [
  "/app",
  "/manifest.webmanifest",
];

// ============================================================
// Install — pre-cache the app shell
// ============================================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Precache failed (non-blocking):", err);
      });
    })
  );
  self.skipWaiting();
});

// ============================================================
// Activate — clean up old caches
// ============================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== SHELL_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ============================================================
// Fetch — routing strategy
// ============================================================
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip Supabase realtime (WebSocket)
  if (url.pathname.includes("/realtime/")) return;

  // Skip AI edge functions — always network-only
  if (url.pathname.startsWith("/functions/")) return;

  // Skip auth endpoints
  if (url.pathname.includes("/auth/")) return;

  // --- API / Supabase REST calls → Network-first ---
  if (url.pathname.startsWith("/rest/") || url.hostname.includes("supabase")) {
    event.respondWith(networkFirst(request, 5000));
    return;
  }

  // --- Navigation requests → Network-first, fallback to shell ---
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest HTML
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match("/app") || caches.match(request) || offlineFallback();
        })
    );
    return;
  }

  // --- Static assets → Cache-first ---
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // --- Everything else → Network-first ---
  event.respondWith(networkFirst(request, 3000));
});

// ============================================================
// Strategies
// ============================================================

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineFallback();
  }
}

async function networkFirst(request, timeoutMs = 5000) {
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      ),
    ]);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || offlineFallback();
  }
}

function offlineFallback() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Revix — Hors ligne</title>
    <style>
      body { font-family: 'Space Grotesk', system-ui, sans-serif; background: #fbf6e3; display: flex;
        align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
      .card { background: white; border: 2.5px solid #0a0a0a; border-radius: 8px; padding: 40px;
        box-shadow: 4px 4px 0 0 #0a0a0a; max-width: 400px; text-align: center; }
      h1 { font-family: 'Archivo Black', sans-serif; font-size: 24px; margin: 0 0 12px; }
      p { color: #555; font-size: 14px; line-height: 1.5; margin: 0 0 20px; }
      button { background: #7c3aed; color: white; border: 2.5px solid #0a0a0a; border-radius: 8px;
        padding: 12px 24px; font-weight: 600; font-size: 14px; cursor: pointer;
        box-shadow: 2px 2px 0 0 #0a0a0a; transition: all 120ms ease; }
      button:hover { transform: translate(1px,1px); box-shadow: none; }
    </style></head>
    <body><div class="card">
      <h1>📶 Pas de connexion</h1>
      <p>Revix a besoin d'internet pour charger tes cours et quiz. Vérifie ta connexion et réessaie.</p>
      <button onclick="location.reload()">Réessayer</button>
    </div></body></html>`,
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|eot)(\?.*)?$/.test(pathname);
}
