# Implementation Plan: Ajustes varios

**Branch**: `002-ajustes-varios` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-ajustes-varios/spec.md`

## Summary

Ocho cambios independientes:

1. Actualizar la app de una vez. Se espera a que termine la instalación más nueva antes de activarla y no se vuelve a
   avisar si el jugador ya aceptó actualizar.
2. Que el dispositivo viejo no mande. Una instantánea de lo sincronizado distingue el progreso real de lo que solo
   falta porque se quitó en otro dispositivo, y la ventana de elegir partida recomienda la más reciente.
3. Trituradora con diálogo de cantidad, común con la Venta.
4. Tickets sobrantes al precio de la Venta, con una sola fuente por rareza.
5. Sección «Favoritos» en Trituradora y Venta, con una política de favoritos en las reglas de dar y triturar.
6. Número de paradas de las rutas completadas.
7. Recorte de EXP en la torre según el nivel del Pokémon (×0,9 / ×0,8 / ×0,75 desde 50 / 75 / 90).
8. Menta neutra (10 000 ₽), con un campo nuevo en la partida.

Detalle de cada decisión en [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7 (Node `>=22.13`)

**Primary Dependencies**: Vite 8, React 19, vite-plugin-pwa 2.0.0 (workbox-window 7.4.1), Vitest, oxlint

**Storage**: `localStorage` (partida y `CloudLink`), `sessionStorage` (actualización aceptada), D1 sin cambios

**Testing**: Vitest junto a cada fichero de `src/game`; UI con `npm run dev` en viewport móvil y `npm run smoke`

**Target Platform**: PWA en móvil vertical (Chrome/Safari), service worker en modo `prompt`

**Project Type**: app web (PWA) + Worker de Cloudflare (no cambia)

**Performance Goals**: sin requisitos nuevos. La instantánea de sincronización es O(Pokémon), unas decenas de KB como mucho

**Constraints**: sin servidor el juego entero funciona; ninguna partida pierde nada al actualizar; plan gratuito de Cloudflare sin cambios

**Scale/Scope**: 8 historias, ~20 ficheros tocados, 1 subida de `SAVE_VERSION` (65 → 66), 0 migraciones de D1

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Estado | Nota |
|---|---|---|
| I. Lo que existe es diseño | ✅ | La spec lista los 8 choques con su referencia. Los cambios de regla (nube, Trituradora, precio de sobrantes, favoritos, EXP de torre) los pide el usuario de forma explícita, y las 3 dudas se resolvieron con él (sesión 2026-11-17). Se registran en `docs/diseno.md` al implementar. |
| II. Identidad idle / móvil | ✅ | Sin interacción nueva en marcha. Diálogos con `Modal` y «Atrás» del móvil; toques de 44 px; icono de objeto (Menta Seria), sin emojis. |
| III. Capas y lógica pura | ✅ | Reglas nuevas en `src/game` (`cloudChoice`, `FavoritePolicy`, `towerExpMult`, `MintKind`) y `pathStopCount` en `src/data`. `net/` solo guarda la instantánea y la pasa. La UI no calcula precios ni bloqueos. |
| IV. La partida nunca se pierde | ✅ | `SAVE_VERSION` 66 con regla `neutralMints` y test de migración. La bajada automática solo ocurre si aquí no hay nada nuevo desde la última sincronización. Con progreso real se sigue preguntando. `CARRIED_SINCE` sin cambios (justificado en R7). |
| V. Se juega sin servidor | ✅ | Ningún cambio en el Worker ni en D1. Sin cuenta, las historias 2 no aplican y el resto funciona en local. |
| VI. Código limpio | ✅ | Diccionarios `as const` (`FavoritePolicy`, `MintKind`, `SaveSide`). Constantes de balance con nombre y comentario (`TOWER_EXP_LEVEL_CUTS`, `NEUTRAL_MINT_PRICE`, `ticketSalePrice`). `cloudChoice.ts` aparte para no pasar de 200 líneas. Se reutiliza `CountInput` y se crea `CountDialog` en `ui/shared`. |
| VII. Tests sin fijar balance | ✅ | Tests listados en [quickstart.md](quickstart.md); leen las constantes y usan `test-map.ts`. |
| VIII. Documentación viva | ✅ | `docs/diseno.md` (Sistemas: sobrantes, torre, Menta, favoritos, nube), `docs/arquitectura.md` (guardado en la nube: instantánea), tabla de `CLAUDE.md`, anuncio y capturas (`shop-mints`, Trituradora). |

**Re-check tras la fase 1**: sin violaciones. Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/002-ajustes-varios/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/game-actions.md
├── checklists/requirements.md
└── tasks.md             # lo crea /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── net/
│   ├── appUpdate.ts              # H1: esperar a la más nueva, updatefound propio, actualización aceptada
│   ├── cloudSync.ts              # H2: guardar instantánea al sincronizar, recomendación, aviso al bajar
│   ├── cloudState.ts             # H2: lado recomendado
│   └── cloudLink.ts              # H2: leer/validar snapshot
├── store/store.ts                # H2: openedPlayedAt()
├── game/
│   ├── core/
│   │   ├── cloudSave.ts          # H2: cloudAction con instantánea
│   │   ├── cloudChoice.ts (+test)# H2: nuevo (syncSnapshot, progressSince, recommendedSave)
│   │   ├── state.ts              # H8: neutralMints, SAVE_VERSION 66
│   │   └── saveMigration.ts (+test) # H8: regla neutralMints
│   ├── collection/
│   │   ├── shredder.ts (+test)   # H3/H5: política de favoritos, favoriteStock
│   │   └── pieces.ts (+test)     # H4: surplusMoney desde ticketSalePrice
│   ├── trade/
│   │   ├── tradeGive.ts (+test)  # H5: FavoritePolicy
│   │   └── serverSale.ts (+test) # H4/H5: precio desde RARITY_INFO, favoriteMons
│   ├── tower/towerRewards.ts (+test) # H7: TOWER_EXP_LEVEL_CUTS, towerExpMult
│   └── team/
│       ├── mints.ts (+test)      # H8: MintKind, neutra
│       └── bag.ts                # H8: neutralMints
├── data/
│   ├── species.ts                # H4: ticketSalePrice en lugar de surplusMoney
│   └── maps/mapCommon.ts         # H6: pathStopCount
└── ui/
    ├── shared/CountDialog.tsx    # H3/H5: nuevo (sustituye a ui/sell/SellCountDialog.tsx)
    ├── shared/UpdatePrompt.tsx   # H1: sin cambios de texto
    ├── shared/icons.ts           # H8: icono Menta Seria
    ├── shared/sheet/MintPanel.tsx# H8: usar la neutra
    ├── account/CloudChoiceDialog.tsx # H2: «Más reciente»
    ├── gacha/Shredder.tsx, ShredCell.tsx, ShredFavorites.tsx (nuevo) # H3/H5
    ├── sell/SellScreen.tsx, SellFavorites.tsx (nuevo)               # H5
    ├── shop/MintShop.tsx         # H8: segunda casilla
    ├── bag/BagSheet.tsx          # H8
    └── route/RouteStartDialog.tsx# H6
```

**Structure Decision**: la estructura por capas del proyecto (`data → game → store → net → ui`), sin carpetas nuevas.
Las secciones de favoritos van en ficheros propios para que `Shredder.tsx` y `SellScreen.tsx` sigan por debajo de 200
líneas.

## Orden sugerido

Las historias son independientes. Por riesgo y valor: H1 y H2 (fallos que ven todos), luego H4 (prepara el precio
común), H3 y H5 (comparten `CountDialog` y la política de favoritos), y H6, H7 y H8.

## Complexity Tracking

Sin violaciones que justificar.
