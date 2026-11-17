# Quickstart: validar las incursiones programadas

## Requisitos

- Node `>=22.13`, `npm install`.
- Base de datos local con la migración nueva: `npm run db:migrate:local`.
- Dos navegadores (o uno normal y otro privado) para tener dos jugadores con apodo distinto.

## 1. Tests y comprobaciones

```bash
npm run check   # typecheck + lint + tests: schedule/*.test.ts, saveMigration.test.ts, worker/incursionSchedule.test.ts
npm run smoke   # con npm run dev abierto: arranque y pestañas (cambia el guardado)
```

Lo que deben cubrir los tests (sin fijar números: leen las constantes de `scheduleRules.ts`):

- Franjas, antelación mínima y máxima, topes y separación ([data-model.md](data-model.md)).
- Fases con la hora y acciones válidas en cada una.
- Reparto de fianzas: con 0, 1 y varios checkins; redondeo hacia abajo; cancelación sin reparto.
- Arranque: grupo con los del checkin + bots, `legStarts = [startAt]`; nadie ⇒ cancelada.
- Partida: retener fianza sin misión, devolver una sola vez, liquidar con `shares` y con `gone`.
- Migración 64 → 65: la cola guardada desaparece sin gastar llave; campos nuevos con su valor inicial.

## 2. Recorrido con servidor (`npm run preview`, http://localhost:8787)

| Paso | Jugador A | Jugador B | Esperado |
|---|---|---|---|
| 1 | Programar › Cueva Helada › franja dentro de 30 min | — | A ve 1/5 en Mis incursiones; su dinero baja un 10 % |
| 2 | — | Activa avisos de incursiones; abre Tablón | B recibe el aviso; ve la tarjeta con premios, llave y fianza |
| 3 | — | Aceptar | 2/5 en las dos; B paga su fianza |
| 4 | — | (sin Pokémon apto) | No puede aceptar y ve el motivo |
| 5 | Espera a 10 min antes | — | Aviso «Ya puedes entrar a la sala»; «Entrar a la sala» |
| 6 | Checkin | — | Recupera la fianza; marcado el primer Pokémon apto; puede cambiarlo |
| 7 | Fijar | — | Ya no puede cambiar; B ve el candado |
| 8 | — | No hace checkin | — |
| 9 | Hora de comienzo | — | Empieza con A + 4 bots; A recibe la fianza de B; se gasta su llave |

Para no esperar, `startAt` puede forzarse en tests del Worker (`worker/incursionSchedule.test.ts`, con `node:sqlite`).

## 3. Sin servidor (`npm run dev` sin Worker)

- Ruta › Incursiones muestra solo las incursiones con «Jugar ya»; se juega en local con bots como hoy.

## 4. Documentación del mismo cambio

- `docs/incursiones.md` (Decisiones tomadas, Recorrido del jugador, Llaves y premios, Números, protocolo),
  `docs/diseno.md` (Sistemas), tabla de `CLAUDE.md`, `docs/servidor.md` (tabla nueva), anuncio en
  `data/announcements.ts`, guía y capturas de Tutoriales.
