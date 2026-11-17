# Contrato: pantallas (Ruta › Incursiones)

Todo en `src/ui/incursion/`, reutilizando `IconTabs`, `Modal`, `MonPicker`, `MovePicker`, `formatMoney`, `BackdropRow`.
La UI no calcula reglas: lee `schedule/` (fase, fianza, motivo de no poder, cuenta atrás) y llama acciones con `act()`.

`IncursionScreen` decide, en este orden:

1. Incursión en curso → `IncursionView` (como hoy).
2. `incursionCheckin` en una sala abierta → `ScheduleRoom` (pestaña entera).
3. Si no → `IncursionTabs` con subpestañas (`IconTabs`): **Tablón** (`ScheduleBoard`), **Mis incursiones**
   (`MySchedules`), **Programar** (`IncursionList`, con «Programar» / «Jugar ya»). Abre «Mis incursiones» si hay alguna
   pendiente; si no, Tablón; un aviso puede pedir una concreta.

| Componente | Muestra | Acciones |
|---|---|---|
| `ScheduleCard` | Fondo de la incursión, hora (día y hora local), n/5 con apodos, creador, Nv. de entrada, llave (✓/✗), fianza que pagaría, premios (`IncursionPrizes`, sacado de `IncursionInfo`) | Aceptar (con `ConfirmDialog` de la fianza) o motivo de no poder |
| `MySchedules` | Tarjetas propias con cuenta atrás, «Baja con devolución hasta HH:MM» o «Ya no puedes darte de baja» | Darse de baja / Cancelar / Entrar a la sala |
| `ScheduleDialog` | Desde «Programar»: franjas de 15 min de hoy y los próximos 7 días, fianza que se retendrá, topes | Programar |
| `ScheduleRoom` | Cuenta atrás al comienzo, 5 huecos (apodo, sprite, Nv., icono de candado si ha fijado, «sin checkin»), aviso si falta llave | Cambiar Pokémon/ataque (`MonPicker`/`MovePicker`), Fijar (confirmación: no se puede deshacer) |
| «Terminadas» (en `MySchedules`, textos en `scheduleText.ts`) | Qué pasó con la fianza de las ya decididas: devuelta, reparto recibido o perdida | — |

Sin servidor: no hay subpestañas de Tablón ni Mis incursiones; «Programar» muestra «Jugar ya» con bots y una nota de
que programar necesita conexión. La incursión de prueba siempre «Jugar ya».

Cada fichero < 200 líneas; CSS en `incursion.css` (o `schedule.css` si crece). Tutoriales: rehacer la guía de
incursiones y sus capturas (`npm run shots`, escenario nuevo en `demoSave`).
