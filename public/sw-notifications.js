// Se importa en el service worker generado por Workbox (ver vite.config.ts › workbox.importScripts).

// Aviso push del servidor (worker/push): llega cifrado y el navegador ya lo da descifrado; se enseña tal cual. `go` dice
// adónde lleva dentro de la app (ver src/ui/shared/navigation.ts)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Pokérancho', {
      body: data.body || '',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      tag: data.tag,
      data: { go: data.go || null },
    }),
  )
})

// Al tocar una notificación se trae al frente la app si ya está abierta (y se le dice adónde ir); si no, se abre en ese sitio.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const go = event.notification.data && event.notification.data.go
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => 'focus' in w)
      if (!open) return self.clients.openWindow(self.registration.scope + (go ? `?go=${encodeURIComponent(go)}` : ''))
      if (go) open.postMessage({ type: 'go', go })
      return open.focus()
    }),
  )
})
