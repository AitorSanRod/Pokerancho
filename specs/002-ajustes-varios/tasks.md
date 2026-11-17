---

description: "Tareas de Ajustes varios"
---

# Tasks: Ajustes varios

**Input**: Design documents from `/specs/002-ajustes-varios/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/game-actions.md](contracts/game-actions.md), [quickstart.md](quickstart.md)

**Tests**: obligatorios para la lógica de `src/game` (constitución, Principio VII): nombres en español, `initialState()`
y `test-map.ts`, leyendo las constantes, nunca fijando números ni nombres. La UI se verifica a mano en viewport móvil.

**Organization**: una fase por historia de la spec (US1–US8), independientes entre sí salvo lo indicado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (otro fichero, sin dependencias pendientes)
- **[Story]**: historia de la spec (US1…US8)
- Rutas desde la raíz del repositorio. Para cada tarea, usar la skill del proyecto que encaje: `nueva-mecanica`
  (reglas en `src/game`), `nueva-pantalla` (UI), `nuevo-contenido` (datos).

---

## Phase 1: Setup

**Purpose**: punto de partida limpio

- [X] T001 Crear la rama `002-ajustes-varios` desde `main` (sin commits ni push hasta que el usuario lo pida) y comprobar que `npm run check` pasa antes de tocar nada

---

## Phase 2: Foundational (piezas compartidas)

**Purpose**: el diálogo de cantidad común que usan US3 y US5 ([research.md](research.md) R3)

- [X] T002 Crear `src/ui/shared/CountDialog.tsx` según [contracts/game-actions.md](contracts/game-actions.md) › Componentes compartidos (`title`, `max`, `confirmLabel(count)`, `warning?`, `onConfirm(count)`, `onClose`), sobre `ConfirmDialog` y con `CountInput` + `useCorrectionGuard` de `src/ui/trade/`
- [X] T003 Pasar la Venta a `CountDialog`: sustituir `src/ui/sell/SellCountDialog.tsx` en `src/ui/sell/SellScreen.tsx` y borrar `SellCountDialog.tsx` (mismo comportamiento que hoy)

**Checkpoint**: la Venta funciona igual que antes con el diálogo común

---

## Phase 3: User Story 1 - Actualizar la app de una sola vez (Priority: P1) 🎯 MVP

**Goal**: una sola pulsación de «Actualizar» deja la app en la última versión y el aviso no vuelve ([research.md](research.md) R1)

**Independent Test**: [quickstart.md](quickstart.md) › Comprobación a mano 1 (tres builds seguidos con `npm run preview`)

### Implementation for User Story 1

- [X] T004 [US1] En `src/net/appUpdate.ts`, `reloadApp`: esperar a que termine cualquier instalación en curso (`registration.installing`) con `INSTALL_WAIT_MS` = 60 s como tope de seguridad (comentario con unidad y motivo) antes de activar la versión que espera, y recargar al llegar `controllerchange`; `RELOAD_FALLBACK_MS` solo si no llega
- [X] T005 [US1] En `src/net/appUpdate.ts`, `watchForUpdates`: escuchar `updatefound` en la propia `registration` y marcar `ready` cuando la versión nueva quede `installed` con la página ya controlada (no depender de que workbox siga escuchando tras la primera versión externa)
- [X] T006 [US1] En `src/net/appUpdate.ts`: al pulsar «Actualizar», apuntar en `sessionStorage` (con try/catch) la hora de aceptación; en `onNeedRefresh` de la página recargada, si han pasado menos de `ACCEPTED_UPDATE_MS` (2 min, constante con comentario), activar la versión sin mostrar el aviso
- [ ] T007 [US1] Verificar a mano según [quickstart.md](quickstart.md) › 1, también con la red del móvil limitada y sin conexión al pulsar «Actualizar» (recarga con la versión ya descargada), y ejecutar `npm run smoke`

**Checkpoint**: US1 funciona sola

---

## Phase 4: User Story 2 - La partida más reciente manda al volver a un dispositivo viejo (Priority: P1)

**Goal**: el dispositivo viejo sin progreso nuevo baja la nube sin preguntar; con progreso real en los dos lados se pregunta recomendando la más reciente ([research.md](research.md) R2)

**Independent Test**: [quickstart.md](quickstart.md) › Comprobación a mano 2

### Tests for User Story 2

- [X] T008 [P] [US2] Tests en `src/game/core/cloudChoice.test.ts`: `syncSnapshot`/`progressSince` (Pokémon nuevo, más nivel o ★, ruta nueva = progreso; Pokémon que falta = no), `recommendedSave` (la jugada después; empate → nube)
- [X] T009 [P] [US2] Tests en `src/game/core/cloudSave.test.ts` para `cloudAction`: con instantánea y sin progreso desde ella se baja aunque aquí haya un Pokémon que la nube no tiene (vendido en otro dispositivo); con progreso real en los dos lados, pregunta; enlace sin `snapshot`, la regla de antes; si la nube va por delante de la revisión vista, nunca devuelve `Upload` (FR-006)

### Implementation for User Story 2

- [X] T010 [US2] Crear `src/game/core/cloudChoice.ts` con `SyncSnapshot` (data-model.md › SyncSnapshot.mons, SyncSnapshot.routes), `syncSnapshot`, `progressSince`, `SaveSide` (data-model.md › CloudLink.SaveSide) y `recommendedSave` (data-model.md › CloudLink.recommendedSave)
- [X] T011 [US2] En `src/game/core/cloudSave.ts`: añadir `snapshot?` a `CloudLink` (data-model.md › CloudLink.snapshot) y usarlo en la rama «misma cuenta y la nube va por delante» de `cloudAction`
- [X] T012 [US2] En `src/net/cloudLink.ts`, `readLink`: descartar `snapshot` si no tiene la forma de data-model.md › SyncSnapshot (se trata como enlace antiguo)
- [X] T013 [US2] En `src/store/store.ts`: exponer `openedPlayedAt()` (data-model.md › Hora de juego al abrir.openedPlayedAt), el `lastTick` leído del almacenamiento antes del primer avance de tiempo
- [X] T014 [US2] En `src/net/cloudSync.ts`: escribir `snapshot: syncSnapshot(getState())` en cada `writeLink` tras subir o bajar; al preguntar, calcular el lado recomendado con `cloud.updatedAt` y `openedPlayedAt()` en la primera conexión tras abrir (después, `getState().lastTick`) y guardarlo en el estado de la nube (`src/net/cloudState.ts`); en `connect`, cuando `cloudAction` da `Download`, llamar a `loadCloudSave` con el aviso de que se ha cargado la partida más reciente (FR-004)
- [X] T015 [US2] En `src/ui/account/CloudChoiceDialog.tsx`: marcar la tarjeta recomendada con «Más reciente» (estilo destacado, botón primario) y ajustar el texto
- [ ] T016 [US2] Verificar a mano según [quickstart.md](quickstart.md) › 2 con dos navegadores y `npm run preview`

**Checkpoint**: US2 funciona sola

---

## Phase 5: User Story 3 - Triturar escribiendo la cantidad (Priority: P2)

**Goal**: la Trituradora elige cantidades como la Venta ([research.md](research.md) R3). Depende de T002.

**Independent Test**: [quickstart.md](quickstart.md) › Comprobación a mano 3

### Implementation for User Story 3

- [X] T017 [US3] En `src/ui/gacha/ShredCell.tsx`: el toque abre `CountDialog` (máximo = tickets de la especie, botón «Triturar por N trozos» con `shardsPerPiece`) y llama a `shred` vía `act()`; quitar el marcado ticket a ticket
- [X] T018 [US3] En `src/ui/gacha/Shredder.tsx`: quitar el estado de selección; el botón de cada rareza abre un `ConfirmDialog` con el total de trozos (`raritySelection` + `selectionShards`) y tritura con `shredSelection`; mensaje de trozos ganados como hoy
- [ ] T019 [US3] Verificar a mano según [quickstart.md](quickstart.md) › 3 (0, más del máximo, texto)

**Checkpoint**: US3 funciona sola

---

## Phase 6: User Story 4 - Tickets sobrantes al mismo precio que en la Venta (Priority: P2)

**Goal**: el ₽ por ticket de la ficha con ★ al máximo es el de la Venta ([research.md](research.md) R4)

**Independent Test**: [quickstart.md](quickstart.md) › Comprobación a mano 4

### Tests for User Story 4

- [X] T020 [P] [US4] En `src/game/collection/pieces.test.ts`: combinar con ★ al máximo da `PIECES_PER_COMBINE × pieceSalePrice(id)`; en `src/game/trade/serverSale.test.ts`: `sellPieces` paga `count × pieceSalePrice(id)`

### Implementation for User Story 4

- [X] T021 [US4] En `src/data/species.ts`: sustituir `RARITY_INFO.surplusMoney` por `ticketSalePrice` (data-model.md › Rareza.ticketSalePrice, Rareza.surplusMoney) con comentario de unidad y efecto
- [X] T022 [US4] En `src/game/trade/serverSale.ts`: quitar `PIECE_SALE_PRICE`; `pieceSalePrice` lee `RARITY_INFO[r].ticketSalePrice`
- [X] T023 [US4] En `src/game/collection/pieces.ts`: `surplusMoney(id) = PIECES_PER_COMBINE × RARITY_INFO[r].ticketSalePrice`, sin `boostedMoney`; quitar `tickets sobrantes` del comentario de `MONEY_GAIN_MULT` en `src/game/battle/rewards.ts`
- [X] T024 [US4] Buscar con Grep los usos de `PIECE_SALE_PRICE` y `surplusMoney` (UI de la Venta, `src/ui/shared/sheet/TicketsSection.tsx`, tutoriales, herramientas) y pasarlos a la fuente nueva

**Checkpoint**: US4 funciona sola

---

## Phase 7: User Story 5 - Sección de favoritos en Trituradora y Venta (Priority: P2)

**Goal**: triturar y vender favoritos desde su sección, con aviso; en intercambios siguen protegidos ([research.md](research.md) R5). Depende de T002; si US3 está hecha, reutiliza su `ShredCell`.

**Independent Test**: [quickstart.md](quickstart.md) › Comprobación a mano 5

### Tests for User Story 5

- [X] T025 [P] [US5] En `src/game/trade/serverSale.test.ts`: con `FavoritePolicy.Protect` no se vende un Pokémon ni tickets de favorito; con `Allow`, sí; el compañero y un Pokémon fuera del rancho siguen sin venderse con `Allow`; `favoriteMons` solo devuelve favoritos vendibles
- [X] T026 [P] [US5] En `src/game/collection/shredder.test.ts`: `shred` con `Protect` no tritura favoritos y con `Allow`, sí; `favoriteStock` devuelve solo favoritos con tickets; `raritySelection` sigue sin favoritos
- [X] T027 [P] [US5] En `src/game/trade/tradeGive.test.ts`: `takeOffer` sigue rechazando favoritos y `giveMonBlocker`/`givePiecesBlocker` sin política los bloquean

### Implementation for User Story 5

- [X] T028 [US5] En `src/game/trade/tradeGive.ts`: añadir `FavoritePolicy` (data-model.md › Favoritos.FavoritePolicy) y el parámetro con valor por defecto `Protect` en `giveMonBlocker`, `takeMon` y `givePiecesBlocker`; actualizar el comentario de cabecera
- [X] T029 [US5] En `src/game/trade/serverSale.ts`: pasar la política en `sellMon` y `sellPieces`; añadir `favoriteMons(s)`
- [X] T030 [US5] En `src/game/collection/shredder.ts`: pasar la política en `shred`; añadir `favoriteStock(s)`
- [X] T031 [P] [US5] Crear `src/ui/gacha/ShredFavorites.tsx`: sección «Favoritos» (desplegable como `RarityFoldout`) con `favoriteStock`; cada casilla abre `CountDialog` con `warning` de favorito y tritura con `Allow`; se oculta si no hay nada. Montarla en `src/ui/gacha/Shredder.tsx` y cambiar el aviso de «favoritos protegidos»
- [X] T032 [P] [US5] Crear `src/ui/sell/SellFavorites.tsx`: sección «Favoritos» con `favoriteMons` y tickets de especies favoritas; venta con confirmación que avisa de que es favorito, con `Allow`. Montarla en `src/ui/sell/SellScreen.tsx`; en las listas normales los favoritos siguen desactivados como hoy (FR-011)
- [ ] T033 [US5] Verificar a mano según [quickstart.md](quickstart.md) › 5, incluido que Intercambios sigue bloqueando favoritos

**Checkpoint**: US5 funciona sola

---

## Phase 8: User Story 6 - Ver cuántas paradas tiene una ruta completada (Priority: P3)

**Goal**: «N paradas» en la ventana de comenzar de las rutas completadas ([research.md](research.md) R6)

**Independent Test**: [quickstart.md](quickstart.md) › Comprobación a mano 6

- [X] T034 [P] [US6] En `src/data/maps/mapCommon.ts`: `pathStopCount(path)` (data-model.md › Rutas.pathStopCount), con test en el test de mapas existente (o `src/game/run/run.test.ts`) usando `test-map.ts`
- [X] T035 [US6] En `src/ui/route/RouteStartDialog.tsx`: si `game.completedRoutes` incluye la ruta, mostrar «N paradas» del camino `path` (singular con 1)

**Checkpoint**: US6 funciona sola

---

## Phase 9: User Story 7 - Menos EXP en la torre según el nivel (Priority: P3)

**Goal**: ×0,9 / ×0,8 / ×0,75 desde nivel 50 / 75 / 90 del Pokémon que sube ([research.md](research.md) R7)

**Independent Test**: [quickstart.md](quickstart.md) › Comprobación a mano 7

### Tests for User Story 7

- [X] T036 [P] [US7] En `src/game/tower/towerRewards.test.ts`: por debajo del corte más bajo de `TOWER_EXP_LEVEL_CUTS` no cambia; en cada corte, × su `mult` (leído de la constante); `rewardFloor` usa el nivel de antes de sumar la EXP del piso y apunta lo recortado en `earned.exp`

### Implementation for User Story 7

- [X] T037 [US7] En `src/game/tower/towerRewards.ts`: `TOWER_EXP_LEVEL_CUTS` (data-model.md › Torre.TOWER_EXP_LEVEL_CUTS) y `towerExpMult(level)` (data-model.md › Torre.towerExpMult) con comentario de unidad y efecto; aplicarlo en `rewardFloor` con `Math.round`. No tocar `CARRIED_SINCE`
- [X] T038 [US7] Comprobar que `src/game/tower/tower.ts` (único que usa `floorPrize`, que llama a `floorExp`) cobra a través de `rewardFloor` y que `TowerSummary` (`src/ui/tower/TowerSummary.tsx`) enseña `earned.exp` ya recortada; ninguna pantalla ni herramienta muestra `floorExp` directamente

**Checkpoint**: US7 funciona sola

---

## Phase 10: User Story 8 - Menta neutra (Priority: P3)

**Goal**: comprar (10 000 ₽) y usar una Menta que pone la naturaleza Seria ([research.md](research.md) R8)

**Independent Test**: [quickstart.md](quickstart.md) › Comprobación a mano 8

### Tests for User Story 8

- [X] T039 [P] [US8] En `src/game/team/mints.test.ts`: comprar cada tipo descuenta su precio de `MINT_PRICES`; la neutra pone `NEUTRAL_NATURE` y se gasta; no se usa en un Pokémon ya neutro ni fuera del rancho o la Caja; la aleatoria sigue igual
- [X] T040 [P] [US8] En `src/game/core/saveMigration.test.ts`: una partida de la versión anterior llega con `neutralMints` = 0 y conserva `mints`; un `neutralMints` no entero se descarta

### Implementation for User Story 8

- [X] T041 [US8] En `src/game/core/state.ts`: campo `neutralMints` (data-model.md › GameState.neutralMints) con comentario, 0 en `initialState`, y `SAVE_VERSION` 65 → 66
- [X] T042 [US8] En `src/game/core/saveMigration.ts`: regla `neutralMints` en `RULES` (data-model.md › GameState.neutralMints)
- [X] T043 [US8] En `src/game/team/mints.ts`: `MintKind`, `NEUTRAL_MINT_PRICE` y `MINT_PRICES` (data-model.md › Menta.MintKind, Menta.MINT_PRICES), y `mintsOf`, `buyMint`, `mintBlocker`, `applyMint` con el tipo; actualizar el comentario de cabecera
- [X] T044 [US8] En `src/game/team/bag.ts`: `neutralMints` en `Bag` (data-model.md › Menta.Bag.neutralMints)
- [X] T045 [P] [US8] En `src/ui/shared/icons.ts` (y `src/data/items.ts` si hace falta): icono de la Menta Seria de PokeAPI (`serious-mint`)
- [X] T046 [US8] En `src/ui/shop/MintShop.tsx`: segunda casilla para la Menta neutra con `BuyButton` y su precio; adaptar los usos de `MINT_PRICE` en `src/ui/tutorials/guides/shopGuide.ts`
- [X] T047 [US8] En `src/ui/bag/BagSheet.tsx`: casilla «Menta neutra»; en `src/ui/shared/sheet/MintPanel.tsx`: botón para usar la neutra junto al de la aleatoria, con su bloqueo
- [ ] T048 [US8] Verificar a mano según [quickstart.md](quickstart.md) › 8

**Checkpoint**: US8 funciona sola

---

## Phase 11: Polish & Cross-Cutting Concerns

- [X] T049 [P] Actualizar `docs/diseno.md`, tabla «Sistemas»: precio de tickets sobrantes (`ticketSalePrice`), favoritos vendibles desde su sección, Trituradora por cantidad, `TOWER_EXP_LEVEL_CUTS`, Menta neutra (`NEUTRAL_MINT_PRICE`), regla de la nube (instantánea y recomendación)
- [X] T050 [P] Actualizar `docs/arquitectura.md` (guardado en la nube: instantánea en `CloudLink`; actualización de la app)
- [X] T051 [P] Actualizar la tabla de `CLAUDE.md`: `core/cloudChoice.ts`, `ui/shared/CountDialog.tsx` (y quitar `SellCountDialog`), `ui/gacha/ShredFavorites.tsx`, `ui/sell/SellFavorites.tsx`, Menta neutra en la fila de naturalezas, `towerExpMult` en la fila de la torre
- [X] T052 [P] Añadir un anuncio en `src/data/announcements.ts` (Menta neutra, Trituradora por cantidad y favoritos, paradas de rutas completadas)
- [X] T053 Rehacer las capturas afectadas con `npm run shots` (Tienda › Mentas, Trituradora, Venta) si salen en los Tutoriales
- [X] T054 Revisión con la skill `revision-limpia` (ficheros < 200 líneas, sin valores sueltos, sin código muerto)
- [ ] T055 `npm run check` y `npm run smoke` en verde; repasar [quickstart.md](quickstart.md) completo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T003)** → historias.
- La fase 2 solo bloquea US3 y US5 (usan `CountDialog`). US1, US2, US4, US6, US7 y US8 pueden empezar tras T001.
- **Polish**: al final, con las historias que se vayan a publicar.

### User Story Dependencies

- **US1, US2, US4, US6, US7, US8**: independientes.
- **US3**: depende de T002.
- **US5**: depende de T002; si US3 ya está hecha, reutiliza su `ShredCell` con diálogo; si no, `ShredFavorites` usa `CountDialog` directamente.
- **US4 y US5** tocan `src/game/trade/serverSale.ts`: hacerlas una tras otra.
- **US2** toca `src/store/store.ts` y **US8** `src/game/core/state.ts`: ficheros distintos, sin conflicto.

### Within Each User Story

- Tests primero (deben fallar), luego reglas en `src/game`/`src/data`, luego `src/net`/`src/store`, luego UI, luego verificación a mano.

### Parallel Opportunities

- Todos los tests [P] de una historia a la vez.
- Historias en paralelo: US1 ‖ US2 ‖ US6 ‖ US7 ‖ US8 (ficheros distintos).
- T031 ‖ T032 (Trituradora y Venta) tras T028–T030.
- Polish: T049–T052 a la vez.

---

## Parallel Example: User Story 5

```bash
# Tests juntos:
Task: "Tests de FavoritePolicy en src/game/trade/serverSale.test.ts"
Task: "Tests de favoriteStock y shred en src/game/collection/shredder.test.ts"
Task: "Test de intercambios con favoritos en src/game/trade/tradeGive.test.ts"

# Tras las reglas (T028–T030), las dos pantallas juntas:
Task: "Sección Favoritos en src/ui/gacha/ShredFavorites.tsx"
Task: "Sección Favoritos en src/ui/sell/SellFavorites.tsx"
```

---

## Implementation Strategy

### MVP First

1. T001.
2. US1 (actualización) y US2 (nube): los dos fallos que ven todos los jugadores.
3. **Validar** con [quickstart.md](quickstart.md) › 1 y 2, `npm run check` y `npm run smoke`. Se pueden publicar solas.

### Incremental Delivery

1. MVP (US1 + US2).
2. T002–T003 → US4 → US3 → US5 (venta y Trituradora).
3. US6, US7, US8 (en cualquier orden).
4. Polish y publicación (solo cuando el usuario lo pida: cada push a `main` despliega).

---

## Notes

- Commits y push solo cuando el usuario lo pida.
- `SAVE_VERSION` sube una sola vez (US8); si otra historia cambiara `GameState`, se agrupa en esa subida.
- Cada historia deja `npm run check` en verde al terminar.
