# Research: Ajustes varios

Decisiones de la fase 0. Cada una indica qué se ha elegido, por qué y qué otras opciones se descartaron.

## R1. Doble aviso de actualización (historia 1)

**Hallazgos** (leído en `node_modules`, vite-plugin-pwa 2.0.0 y workbox-window 7.4.1):

- `workbox-window` (`_onUpdateFound`) marca como «externa» cualquier versión encontrada más de un minuto después de
  registrarse, la guarda en `_externalSW` y **deja de escuchar `updatefound`**. vite-plugin-pwa solo avisa con el evento
  `waiting` de esa versión. Las versiones que se encuentran después ya no disparan `onNeedRefresh` por sí solas.
- `reloadApp` (`src/net/appUpdate.ts`) llama a `registration.update()` y espera a la versión que se está instalando
  como mucho `INSTALL_WAIT_MS` (20 s). Si la más nueva tarda más (precachea las imágenes y en el móvil es lento), se
  activa la que esperaba (una intermedia) y se recarga. Al cargar, la más nueva termina de instalarse y queda esperando:
  **segundo aviso**. Es el caso «varias publicaciones seguidas».
- `RELOAD_FALLBACK_MS` (3 s) recarga aunque la nueva versión aún no controle la página. La página puede cargarse
  todavía con la versión vieja.

**Decision**:

1. `reloadApp` espera a que termine **cualquier** instalación en curso sin el tope de 20 s. Mantiene «Actualizando…» y
   pone un tope de seguridad más largo (`INSTALL_WAIT_MS` = 60 s). Después activa la que espera, que ya es la más nueva.
2. Al pulsar «Actualizar» se apunta en `sessionStorage` que el jugador ya aceptó actualizar, con la hora. Si en la
   página recargada aparece otra versión esperando dentro de `ACCEPTED_UPDATE_MS` (2 min), se activa sola, sin volver a
   avisar. Así, si aun así se instala otra versión justo detrás, el jugador no ve un segundo aviso.
3. `watchForUpdates` escucha `updatefound` en la propia `registration`. Cuando una versión nueva queda `installed` con
   la página ya controlada, se marca `ready`. Así no depende de que workbox siga escuchando.
4. La recarga se hace al cambiar de controlador (`controllerchange`). El tope de `RELOAD_FALLBACK_MS` solo se usa si
   no llega.

**Rationale**: corrige las dos causas (versión intermedia y aviso perdido o repetido) sin cambiar el modo `prompt`. El
jugador sigue decidiendo cuándo recargar.

**Alternatives considered**: `registerType: 'autoUpdate'` (recarga sin preguntar: rompe partidas a medias y contradice
el aviso actual); `skipWaiting` en el service worker (mismo problema); bajar el tamaño del precache (no resuelve la
carrera).

## R2. El dispositivo viejo «manda» tras actualizar (historia 2)

**Hallazgo**: `hasUnsavedProgress` (`src/game/core/cloudSave.ts`) cuenta como «progreso de aquí» todo Pokémon del
dispositivo que no esté en la nube. Si en el otro dispositivo se vendió, se intercambió o se recreó (uid nuevo) un
Pokémon, el dispositivo viejo, que no ha jugado nada, sigue teniéndolo. La app pregunta con «¿Con qué partida sigues?»
y pone la partida vieja al mismo nivel que la buena. Con un dispositivo que lleva mucho sin usarse pasa casi siempre.
Es lo que el jugador percibe como «toma como referencia el guardado de ese dispositivo». No hay subida automática
encima de una más reciente: el servidor responde 409 y se resuelve el conflicto.

**Decision**:

1. Al sincronizar (subir o bajar), el dispositivo guarda en su `CloudLink` una **instantánea** de lo que había en ese
   momento (`SyncSnapshot`: uid → nivel y ★ de cada Pokémon y las rutas completadas). Cuenta como progreso de aquí
   solo lo que mejora esa instantánea **y** además no está en la nube (`progressSince`). Si no hay nada, se baja la de
   la nube sin preguntar (FR-004).
2. Si hay progreso real en los dos lados, se sigue preguntando (respuesta del usuario). La ventana marca como
   **«Más reciente» y recomendada** la que se jugó después (`recommendedSave`). Se compara `cloud.updatedAt` con la hora
   de la última vez que se jugó aquí. Esa hora se toma como el `lastTick` de la partida guardada **al abrir la app**, antes
   de que el avance sin conexión lo ponga en «ahora». En las conexiones siguientes, con la app ya en uso, vale el
   `lastTick` actual.
3. Con un `CloudLink` antiguo sin instantánea, se mantiene la regla de hoy (ver data-model).

**Rationale**: elimina los falsos «tienes progreso» sin perder la garantía del Principio IV: si aquí se ha jugado
algo nuevo desde la última sincronización, se sigue preguntando. No toca el servidor.

**Alternatives considered**: cargar siempre la más reciente por fecha (el usuario prefirió seguir preguntando); fiarse
solo de `lastTick` (el avance sin conexión lo adelanta al abrir y haría parecer reciente la partida vieja); guardar la
instantánea en `GameState` (obligaría a subir `SAVE_VERSION` y viajaría a la nube sin necesidad: es estado del
dispositivo, como la revisión vista).

## R3. Diálogo de cantidad común (historias 3 y 5)

**Decision**: `SellCountDialog` pasa a una pieza común `ui/shared/CountDialog.tsx` (título, máximo, etiqueta del botón
según la cantidad, aviso opcional y acción). `CountInput` y `useCorrectionGuard` vienen de `ui/trade/`. La Venta y la
Trituradora la usan igual. En la Trituradora, tocar la casilla abre el diálogo. «Triturar los N tickets» de una rareza
pasa a ser un botón que abre una confirmación (`ConfirmDialog`) con el total de trozos, en lugar de marcar.

**Rationale**: una sola forma de elegir cantidades en toda la app (Principio VI: reutilizar `ui/shared`).

**Alternatives considered**: mantener la selección ticket a ticket con un campo extra (dos formas de hacer lo mismo).

## R4. Precio de los tickets sobrantes (historia 4)

**Decision**: el precio por ticket de cada rareza pasa a `RARITY_INFO[r].ticketSalePrice` (`src/data/species.ts`) con
los valores actuales de `PIECE_SALE_PRICE` (50 / 100 / 150 / 250). `serverSale.ts › pieceSalePrice` y
`pieces.ts › surplusMoney` (= `PIECES_PER_COMBINE` × precio, **sin** `MONEY_GAIN_MULT`) lo leen de ahí. Se quitan
`PIECE_SALE_PRICE` y `RARITY_INFO.surplusMoney`.

**Rationale**: una sola fuente para el precio. Importarlo de `serverSale.ts` desde `pieces.ts` crearía un ciclo
(`serverSale → tradeGive → pieces`). La Venta no aplica `MONEY_GAIN_MULT`; para que coincidan exactamente, la ficha
tampoco.

**Alternatives considered**: dejar los precios de la ficha y cambiar los de la Venta (el usuario toma la Venta como
referencia).

## R5. Vender y triturar favoritos (historia 5)

**Decision**: diccionario `FavoritePolicy = { Protect, Allow }` en `game/trade/tradeGive.ts`. Lo reciben, como
parámetro con valor por defecto `Protect`, `giveMonBlocker`, `takeMon`, `givePiecesBlocker`, `sellMon`, `sellPieces` y
`shred`. Solo la sección «Favoritos» de la UI pasa `Allow`. Los intercambios no cambian de llamada, así que siguen
protegidos. El resto de bloqueos (compañero, fuera del rancho, cantidad) se mantiene con cualquier política.
`shreddableStock` y `raritySelection` siguen sin favoritos. Nuevo `favoriteStock(s)` para la sección.

**Rationale**: la regla vive en `src/game` y la UI no la reimplementa (Principio III); el comportamiento por defecto no
cambia.

**Alternatives considered**: funciones aparte `sellFavoriteMon`… (duplican la lógica); un booleano suelto (menos
legible que el diccionario).

## R6. Número de paradas (historia 6)

**Decision**: `pathStopCount(path)` = `path.length − 1` en `data/maps/mapCommon.ts`, junto a `pathFrom`. El nodo de
salida no es parada, como en `StopTrack` y `run.ts`. `RouteStartDialog` lo muestra («N paradas») si la ruta está en
`completedRoutes`. Los gimnasios también lo muestran (ya dicen cuántos Pokémon tiene el líder).

## R7. EXP de la torre por nivel (historia 7)

**Decision**: `TOWER_EXP_LEVEL_CUTS` en `game/tower/towerRewards.ts` (lista de `{ fromLevel, mult }`, de mayor a
menor: 90 → 0,75; 75 → 0,8; 50 → 0,9) y `towerExpMult(level)`. Se aplica dentro de `rewardFloor` con el nivel del
Pokémon **antes** de sumar la EXP de ese piso. `floorExp(floor)` sigue siendo la base (también sirve para la vista
previa y los textos). No se toca `CARRIED_SINCE` de `TowerRun`: la forma no cambia y una subida a medias solo pasa a
cobrar con la nueva tasa.

**Alternatives considered**: meterlo en `floorPrize` (entonces el premio dependería del Pokémon y la firma cambiaría
en todos los usos).

## R8. Menta neutra (historia 8)

**Decision**: diccionario `MintKind = { Random, Neutral }` en `game/team/mints.ts`, con precios por tipo
(`MINT_PRICE` 20 000 se mantiene y se añade `NEUTRAL_MINT_PRICE` 10 000). `mintsOf`, `buyMint`, `mintBlocker` y
`applyMint` reciben el tipo. Nuevo campo `GameState.neutralMints` (las aleatorias siguen en `mints` para no renombrar
lo guardado). `SAVE_VERSION` 65 → 66 y regla `neutralMints` en `RULES` (entero; si falta, 0). La neutra no se puede
usar en un Pokémon que ya es Seria (`NEUTRAL_NATURE`). Icono: la Menta Seria de PokeAPI (`serious-mint`) en
`ui/shared/icons.ts`.

**Alternatives considered**: `mints: Record<MintKind, number>` (cambia el significado de un campo guardado: necesita un
paso de migración sin aportar nada).
