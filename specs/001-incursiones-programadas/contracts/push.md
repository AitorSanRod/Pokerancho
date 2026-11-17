# Contrato: avisos de incursiones programadas

Tema nuevo `PushTopic.Incursion = 'incursion'` en `src/game/core/push.ts` (en `PUSH_TOPICS`, no en `CLIENT_TOPICS`:
los programa el servidor). Textos y claves en `src/game/incursion/schedule/schedulePushes.ts` (puro, como
`raidPushes.ts`).

| Cuándo | A quién | Clave | `dueAt` | Título / cuerpo | Destino (`go`) |
|---|---|---|---|---|---|
| `create` | `'all'` salvo el creador | `incursion-new:<id>` | ahora | «Nueva incursión: <nombre>» / «<apodo> la ha programado; empieza dentro de <tiempo>. Quedan <n> huecos.» (el servidor no sabe la zona horaria: tiempo que falta, no la hora) | Tablón |
| `create`, `join` | ese jugador | `incursion-open:<id>` | `startAt − CHECKIN_OPEN_MS` | «Ya puedes entrar a la sala» / «<nombre> empieza en 10 min. Haz el checkin para recuperar tu fianza.» | Mis incursiones |
| `leave` | — | borra `incursion-open:<id>` de ese jugador | — | — | — |
| `cancel` | apuntados salvo el creador | `incursion-cancel:<id>` (y borra `incursion-open:<id>` de todos) | ahora | «Incursión cancelada» / «<nombre> se ha cancelado: recuperas tu fianza.» | Mis incursiones |

- `worker/push/store.ts › cancelJobs(db, playerIds, topic, key)`: nueva, borra avisos aún no mandados.
- El aviso que manda el servidor (`worker/push/send.ts`) lleva `go: 'incursions/board' | 'incursions/mine'`, sacado de su
  tema y su clave (`schedulePushes.ts › pushGoOf`; sin columna nueva en `push_jobs`); `public/sw-notifications.js` abre
  (o enfoca) la app con `?go=…` y `ui/shared/navigation.ts` lleva a Ruta › Incursiones en esa subpestaña (FR-032).
- Ajustes › Notificaciones (`ui/settings/NotificationsDialog.tsx`): interruptor «Incursiones programadas».
