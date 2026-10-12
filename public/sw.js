// CHARI service worker: makes the site installable and shows admin alerts.
// It deliberately caches nothing except an offline notice, so a new deploy is always seen straight away.
const OFFLINE_HTML = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>CHARI</title></head>
<body style="font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px;color:#0f172a">
<div><h1 style="font-size:22px">You're offline</h1><p style="color:#64748b">Check your internet connection, then try again.</p>
<button onclick="location.reload()" style="background:#2563eb;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-weight:700">Try again</button></div></body></html>`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Pages: always from the network; show a friendly notice when there's no connection.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(() => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'CHARI', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { url: data.url || '/#/admin' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/#/admin', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.focus();
        return client.navigate(target).catch(() => {});
      }
    }
    return self.clients.openWindow(target);
  })());
});
