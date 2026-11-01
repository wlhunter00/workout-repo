// Offline support for Will's workout site. Version bumps whenever pages change.
const CACHE = "workouts-13cb9ee991";
const PRECACHE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "2026-10-31.html", "sample-workout.html"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(PRECACHE.map(u => c.add(new Request(u, {cache: "reload"})).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("workouts-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;                                   // logging POSTs: network only (page queues them)
  const sameOrigin = u.origin === self.location.origin;
  const thumb = u.hostname === "i.ytimg.com";
  if (!sameOrigin && !thumb) return;                                // YouTube embeds, Apps Script: network only
  // cache-first, update in background (stale-while-revalidate)
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r, {ignoreSearch: sameOrigin});
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (r.mode === "navigate") return (await c.match("index.html")) || Response.error();
    return Response.error();
  }));
});
