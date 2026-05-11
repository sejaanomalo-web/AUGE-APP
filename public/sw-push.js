// AUGE — Push notification handlers
// Importado pelo service worker gerado pelo next-pwa via workboxOptions.importScripts.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "ꓥuge", body: event.data.text() };
  }

  const { title = "ꓥuge", body = "", data = {}, tag, url } = payload;

  const options = {
    body,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    data: { ...data, url: url || "/" },
    tag: tag || "auge-default",
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.includes(self.location.origin) &&
            "focus" in client
          ) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});

self.addEventListener("notificationclose", () => {
  // hook futuro: telemetria de dismissals
});
