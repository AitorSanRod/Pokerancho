# Arquitectura

## Capas

```
src/data/   Datos estáticos y consultas sobre ellos. No conoce el estado de la partida.
src/game/   Reglas del juego. Funciones puras sobre GameState. Sin React ni DOM.
src/store/  Estado vivo en el navegador: act(), useGame(), guardado en localStorage y una sola pestaña jugando.
src/net/    Conexión con el servidor: salas compartidas, cuenta opcional y partida en la nube.
src/ui/     Componentes React. Leen GameState y disparan acciones con act().
worker/     Servidor: Worker de Cloudflare con base de datos D1 (API /api/*). La lógica del juego es la de src/game.
migrations/ Esquema de la base de datos D1, un fichero por cambio.
scripts/    Utilidades de desarrollo (regenerar pokemon.json, iconos PWA, capturas de los tutoriales). No se empaquetan.
```

Regla de dependencias: `ui → net → game → data` y `worker → game → data`. Nunca al revés. `data` no importa de
`game`; `game` no importa de `net` ni de `ui`. `src/game` y `src/data` se ejecutan también en el servidor: nada de
DOM ni de `import` de imágenes en ellos (las imágenes de los mapas van con `asset(new URL(…, import.meta.url))`).

## Estructura

```
src/
  main.tsx            Arranque: estilos base, service worker (net/appUpdate.ts) y <App> dentro del ErrorBoundary
  App.tsx             Bucle de tiempo, menú inferior y pantalla de cada pestaña
  index.css           Entrada de los estilos base (src/styles/: variables, estructura y piezas comunes)
  assets/             Imágenes (fondos de rancho en ranches/, recortes de mapas de los juegos)
  data/               species, pokemon (ids por nombre), pokedexes (regionales y Nacional), types, moves,
                      evolutions, stones + pokemon.json
    maps/             kantoMaps (una por región), mapCommon, index (regiones y route)
  game/
    core/             state (GameState, SAVE_VERSION), saveMigration, teamBackup, random, tick,
                      test-utils, test-map
    battle/           battle (simulación por turnos), attack (un turno de ataque), status (estados alterados),
                      combatBonus (pasivas sumadas), rewards (₽, tickets, EXP y piezas por victoria)
    run/              run (salida, avance por tiempo, toques), runBattle (combates de la ruta y premio final)
    team/             mons (alta), stats, ranch, ranches (espacios, Caja, traslados), ranchPassives (pasivas del rancho),
                      ranchTypes (tipos de rancho), evolution, stones, expedition, upgrades,
                      tutorial
    collection/       dex (vistos, capturados, favoritos), pieces, gacha, shredder
    raid/             Jefes de la pestaña Raids: raidSchedule (calendario: sala abierta y pelea), rotationBosses (jefe de
                      cada ciclo), raidRoom (la sala), raidBots, raidLobby (de la sala a la pelea), raidFight (la pelea
                      con el motor de incursiones), raidCrit (anillo crítico), raid + raidPlay (en la partida: entrar,
                      salir, pelea local, cobrar), raidLateJoin (entrar en la pelea empezada),
                      raidMoves (solo ataques de daño), raidPrizes; routeRaid + routeRaidStreak (premio de las paradas de ruta)
    incursion/        Incursiones (mazmorras de 5; ver docs/incursiones.md): incursionRun (tramos encadenados, retirada),
                      incursionLeg (un tramo: salas hasta reorganizar o el final), groupBattle (combate N contra M),
                      moveEffects + targeting (qué hace cada movimiento y a quién), groupStatus, bossMechanics, revives,
                      groupPassives, movePicks + incursionPicks (cambiar ataque y objetivo en plena pelea), repertoire, party (bots),
                      incursionRewards, incursionTimeline, retreatVote, entry (nivel mínimo y máximo para entrar), keys, activeIncursion (lo guardado y por dónde va) e incursionGame (en la partida, sin servidor); online/ (protocolo, validar, el grupo en el servidor y la partida enlazada)
    trade/            Intercambios: tradeGoods (qué se ofrece y pide, límites, validar), tradeGive (lo que sale de la
                      partida), tradeReceive (lo que entra; repetidos), tradeOps (operaciones que aplican servidor y móvil),
                      tradeProtocol (tablón y peticiones), goodText (textos), serverSale (venta al servidor)
      online/         Salas de la pestaña Raids con servidor: protocol (lo que se dicen juego y servidor), sharedRaid (la sala
                      en el servidor), linkedRaid (la sala de la partida enlazada a la del servidor), requests (validar
                      lo que le llega), damageTally (daño para el ranking), raidPushes (aviso de que empieza)
  net/                identity (id de jugador y apodo), raidApi (fetch a /api/raid), raidSync (bucle de consultas),
                      raidBoard (la pestaña Raids según el servidor),
                      account (cuenta: /api/auth), cloudSync + cloudState + cloudLink (partida en la nube), dailyGift (obsequio diario),
                      push (notificaciones), tradeApi + tradeBoard (intercambios: /api/trade)
  ui/
    shared/           Sprite, ItemIcon e icons (iconos con objetos de PokeAPI) y piezas comunes, pantallas superpuestas (premios, aparición, confirmación),
                      barra superior, bocadillos del tutorial, ErrorBoundary
      sheet/          Ficha del Pokémon (PokemonSheet): un solo componente que abren rancho y Pokédex, con sus
                      secciones (MonOverview = Datos, CareSection, TicketsSection, EvolvePanel, MovePanel)
                      y la animación de aparición/evolución
    starter/          Elección del inicial (primer paso del tutorial)
    account/          Cuenta: entrar, crearla, recuperar la contraseña (AccountDialog), elegir partida y avisos (AccountHost)
    gift/             Obsequio diario (DailyGiftSheet), que se abre desde el menú del rancho (ranch/RanchMenu)
    shop/             Tienda (ShopScreen: pestañas Tienda, Intercambios y Venta); trade/ (Intercambios), sell/ (Venta)
    inbox/            Notificaciones del menú del rancho (InboxSheet): obsequio listo, premios de raid e intercambios
    ranch/            Rancho (varios ranchos, arrastre, Caja); al tocar un Pokémon abre PokemonSheet
    settings/         Menú ⚙️ y notificaciones
    route/            Pestaña Ruta: lista de rutas y diálogo de comenzar, ruta en curso, combate, escena por bioma
                      (pixelScene/: pixel art generado y animado en canvas, ver fondos.md)
    expeditions/      Enviar, seguir y recoger expediciones
    raid/             Pestaña Ruta › Raids: una pestaña por rotación, la sala abierta (RaidLobby: lista, entrar, cambiar o
                      salir), la pelea (RaidFightView bajo las pestañas, con la escena de la incursión, cabecera
                      como la de ruta en RaidFightHud y la barra de ataques de las rutas), el anillo crítico, el
                      final y el apodo (NicknameDialog)
    incursion/        Pestaña Ruta › Incursiones: lista con información, preparación (Pokémon y movimiento), la
                      incursión en curso (IncursionStage sobre la escena de ruta; sceneState rehace cada momento desde
                      los eventos), sala de reorganizar, retirada y final
    gacha/            Tiradas, apertura de la Pokéball, trituradora y tienda de MissingNo
    dex/              Pokédex; al tocar una casilla abre PokemonSheet, la misma ficha que el rancho
    shop/             Mejoras
worker/
  index.ts            Entrada: /api/raid, /api/save y /api/auth/* (la web la sirve Cloudflare sin pasar por aquí)
  raid.ts             POST /api/raid: las salas de la pestaña Raids (lee de D1, llama a game/raid/online y guarda)
  incursion.ts        POST /api/incursion: cola y grupos de incursión (lee de D1, llama a game/incursion/online y guarda)
  save.ts             GET / POST /api/save: la partida de la cuenta con sesión
  gift.ts             GET / POST /api/gift: el obsequio diario de la cuenta con sesión
  push/               Notificaciones: routes (/api/push/*), webPush (VAPID y cifrado), store (D1), notify, send
  scheduled.ts        Tarea programada de cada minuto: borrar salas viejas, ranking y avisos que tocan
  auth/               Cuentas: routes (rutas), credentials (crear y entrar), links (correos: confirmar y recuperar),
                      session (cookie), crypto (PBKDF2 y tokens)
  db/                 Consultas a D1: rooms, saves, gifts, users (cuentas, sesiones y enlaces)
  mail.ts             Correos con Brevo
  test/               D1 de pruebas sobre node:sqlite y un Worker de pruebas con cookie
```

Cada pantalla tiene su CSS en su carpeta y lo importa su componente (`RanchScreen.tsx` → `ranch.css`). Los
estilos base se cargan antes (`main.tsx`), así los de cada pantalla pueden pisarlos.

| Módulo | Responsabilidad |
|---|---|
| `data/species.ts` | Especies (desde `pokemon.json`, reducidas a 4 stats), rarezas, sprites, iniciales |
| `data/pokemon.ts` | `POKEMON`: número de cada especie por su nombre (`POKEMON.Pidgey`), para no escribir ids sueltos |
| `data/types.ts` | Tipos y tabla de eficacias |
| `data/moves.ts` | Un movimiento de daño por tipo y rareza; `signatureMove` da el de cada especie |
| `data/maps/kantoMaps.ts` | Rutas de Kanto; solo datos. Cada región tendrá su `xxxMaps.ts` |
| `data/maps/mapCommon.ts` | Tipos y diccionarios de los mapas, atajos para escribirlos (`enc`, `boss`, `chain`) y consultas de caminos (`pathFrom`, `isValidPath`) |
| `data/maps/index.ts` | Entrada de la carpeta (se importa como `data/maps`): lista de regiones y `route(id)` |
| `data/evolutions.ts` | Evoluciones, cada una por nivel o por objeto evolutivo (`evolutionsOf`, `evolutionTo`) |
| `data/stones.ts` | Objetos evolutivos: piedras, armaduras y Escama Bella (`Stone`, `STONES`, con su precio) |
| `data/forms.ts` | Objetos de forma (`FormItem`, `FORM_ITEMS`: la forma a la que lleva cada uno y su precio). Las formas son especies de `pokemon.json` con `baseId`: fuera de `SPECIES` (gacha, Pokédex, tickets), en `FORM_SPECIES`; `baseSpeciesOf` da su especie |
| `game/core/state.ts` | Tipos de `GameState`, estado inicial, `SAVE_VERSION`, `restoreState` y dónde está cada Pokémon (`monPlace`) |
| `store/store.ts` | Estado global, `act()`, `useGame()` y cuándo se guarda (`SAVE_DELAY_MS`; siempre al ocultar la app) |
| `store/persistence.ts` | Leer y escribir la partida y la copia del equipo en `localStorage` (con almacenamiento inyectable en los tests) |
| `store/tabLock.ts`, `store/boot.ts` | Una sola pestaña juega (Web Locks): la otra enseña `ui/shared/OtherTabScreen` con «Jugar aquí», que guarda en la primera y se la quita; arranque desde `main.tsx` |
| `game/core/saveMigration.ts` | Migrar una partida de otra versión sin perder nada: pasos de `SAVE_MIGRATIONS` y rescate campo a campo |
| `game/core/teamBackup.ts` | Copia del equipo (y de sus expediciones en curso): red de seguridad si la partida guardada no se puede leer |
| `game/core/random.ts` | Tipo `Rng` y utilidades de azar (`seededRng`: secuencia fija a partir de una semilla) |
| `game/core/tick.ts` | `tick`: avance del tiempo (ruta, expediciones y descanso) |
| `game/battle/battle.ts` | Simulación de combate automático |
| `game/battle/rewards.ts` | Dinero, tickets y piezas por victoria |
| `game/run/run.ts` | Ruta del Pokémon activo: salida, avance por tiempo, pasos y toques |
| `game/run/runBattle.ts` | Combates de la ruta: se resuelven al llegar y se aplican al acabar su tiempo; premio final |
| `game/run/runHeal.ts` | Paradas de curación: al llegar se usa la poción y el Pokémon se para `HEAL_STOP_MS` |
| `game/team/mons.ts` | Alta de un Pokémon (`createMon`) |
| `game/team/stats.ts` | Fórmulas de stats, EXP y velocidad de paso |
| `game/team/ranch.ts` | Acciones del rancho y descanso |
| `game/team/ranches.ts` | Espacios de cada rancho, la Caja, traslados entre ellos y sitio arrastrado (`moveMon`, `placeMon`) |
| `game/team/evolution.ts` | Evolucionar por nivel o piedra (`evolve`, `evolveBlocker`, `evolvePrice`) |
| `game/team/stones.ts` | Comprar y gastar piedras evolutivas (`buyStone`, `spendStone`) |
| `game/team/expedition.ts` | Expediciones por tiempo |
| `game/team/upgrades.ts` | Mejoras de la pestaña Tienda (precios por nivel y compra) |
| `game/team/ranchExpansion.ts` | Ampliación de rancho: compra y espacios de más del rancho elegido |
| `game/team/ranchNames.ts` | Nombre que el jugador pone a cada rancho |
| `game/team/tutorial.ts` | Elección del inicial (da sus piezas) y pasos del tutorial; `combine` y `startRun` lo avanzan |
| `game/collection/dex.ts` | Vistos, capturados y favoritos |
| `game/collection/pieces.ts` | Piezas por especie y combinación (desbloqueo, ★ o ₽) |
| `game/collection/gacha.ts` | Tiradas (piezas) y compra de tickets |
| `game/collection/shredder.ts` | Trituradora (piezas → trozos de MissingNo) y compra de piezas con trozos |
| `game/raid/raidSchedule.ts` | Calendario de la pestaña Raids por la hora real: ciclo, sala abierta (`RAID_LOBBY_MS`) y pelea (`RAID_FIGHT_MS`) |
| `game/raid/rotationBosses.ts` | La lista de jefes de cada rotación (`HARD_RAID_BOSSES` con las stats ×`HARD_RAID_STAT_MULT`) y el jefe de cada ciclo (`cycleBoss`, con semilla en la difícil) |
| `game/raid/raidRoom.ts` | La sala (`RaidRoom`: entrantes, semilla y pelea), sentar, cambiar y sacar; tipo del premio (`RaidPrize`) |
| `game/raid/raidBots.ts` | Bots de la sala: salen de su semilla y llegan con la sala abierta; cada jugador ocupa el sitio de uno |
| `game/raid/raidLobby.ts` | El paso a la pelea: a su hora (`fightDue`), con los jugadores y bots hasta llenarla (`startFight`) |
| `game/raid/raidFight.ts` | La pelea para el motor de incursiones (`raidSource`: el jefe como rival con sus mecánicas, revivires y límite de tiempo) y la parte del jefe quitada |
| `game/raid/raidCrit.ts` | Cuándo sale el anillo crítico en la pelea (`fightRingAt`) |
| `game/raid/raid.ts` | En la partida: `TabRaid` (sala, Pokémon, enlace con el servidor), entrar o cambiar (`joinRaid`, también en la pelea empezada), salir, por qué no se puede |
| `game/raid/raidLateJoin.ts` | Entrar en la pelea empezada: si se puede (`lateJoinBlocker`: vida del jefe y bots), la sala local con solo bots puesta al día, sentarse (`seatLate`) |
| `game/raid/raidMoves.ts` | Los ataques de la pelea: solo de daño mientras `RAID_DAMAGE_ONLY` (jugadores y bots) |
| `game/raid/raidPlay.ts` | En la partida: la pelea local (empieza a su hora, cierra ventanas), ataque, toques y crítico, cobrar y, al acabar el ciclo, el premio a Notificaciones |
| `game/raid/raidPrizes.ts` | Tirada de la tabla, premio por la parte del jefe quitada (`fightPrize`) y recogida |
| `game/raid/routeRaid.ts` | Jefes de las paradas de ruta: al vencerlos (un combate de jefe de la ruta), su premio de raid |
| `game/raid/routeRaidStreak.ts` | Racha de victorias seguidas contra el jefe de cada parada: rebaja su dinero y se olvida a los 5 min |
| `game/raid/online/protocol.ts` | Peticiones y respuestas entre el juego y el servidor de raids |
| `game/raid/online/sharedRaid.ts` | La sala del servidor: asientos, elegir sala (`roomFor`), entrar y salir, cerrar ventanas (`advanceShared`), toques, ataques y críticos, la vista de cada jugador |
| `game/raid/online/linkedRaid.ts` | La sala de la partida enlazada a la del servidor: qué pedir (`joinRequest`), aplicar la respuesta (`applyRoomView`) y seguir en local (`dropRoom`) |
| `game/raid/online/requests.ts` | Validación de lo que llega al servidor y limpieza del apodo |
| `net/raidSync.ts` | Bucle que entra, consulta y avisa de las salas dejadas; cada cuánto se consulta; toques, ataques y críticos |
| `net/raidBoard.ts` | La pestaña Raids según el servidor: cuántos esperan a cada jefe y la hora del servidor |
| `game/core/accountRules.ts` | Lo que comparten web y servidor de cuentas: email, contraseña, códigos de error |
| `game/core/cloudSave.ts` | Partida en la nube: qué hacer al conectar (`cloudAction`), progreso sin subir (`hasUnsavedProgress`), app sin actualizar (`isFromNewerApp`, `SaveRejection`), recuperar una copia (`stateFromSaved`), resumen y validar la subida |
| `net/account.ts` | Cuenta opcional: sesión, enlaces de los correos, entrar, crearla, recuperar la contraseña (`/api/auth`) |
| `net/cloudSync.ts` + `net/cloudState.ts` | Subir y bajar la partida de la cuenta; conflictos entre dispositivos y app sin actualizar; `withCloudInSync` para los intercambios / lo que ve la UI |
| `game/trade/tradeOps.ts` | Operaciones de intercambio (anunciar, pagar, recoger) que aplica el servidor a la partida de la nube y el móvil a la suya |
| `net/tradeApi.ts`, `net/tradeBoard.ts` | Peticiones de intercambio y el tablón (con lo pendiente de Notificaciones), consultado cada minuto |

## Store y acciones

- `store/store.ts` guarda un único `GameState`. `useGame()` lo expone a React con `useSyncExternalStore`.
- Toda modificación pasa por `act((draft) => ...)`. `act` clona el estado, aplica la receta, notifica a la
  UI y programa un guardado (con debounce y también en `pagehide`/`visibilitychange`).
- `main.tsx` arranca con `store/boot.ts › bootGame`: si la partida ya está abierta en otra pestaña, no se carga y se
  enseña el aviso; si se juega aquí, la otra guarda, deja de guardar y se recarga para enseñar el aviso.
- Las funciones de `game/` **mutan el borrador que reciben** (`s: GameState`) y nunca importan el store.
  Así se pueden testear sin navegador:

```ts
const s = initialState()
chooseStarter(s, POKEMON.Bulbasaur) // atajo de core/test-utils.ts: da el inicial y salta el tutorial
startRun(s, RouteId.PuebloPaleta)
```

## Aleatoriedad

Toda función con azar acepta `rng: Rng = Math.random` como último parámetro (`Rng` está en `game/core/random.ts`).
En los tests se pasa un rng determinista. Una función nueva con azar **debe** seguir este patrón.

## Guardado y versiones

- `SAVE_VERSION` (en `core/state.ts`) se compara al cargar (`cloudSave.ts › stateFromSaved`, también para la
  partida de la nube). Si coincide, `restoreState` rellena con su valor inicial los campos que falten.
- **Si no coincide, la partida se migra y no se pierde nada** (`core/saveMigration.ts › migrateSave`): primero los
  pasos de `SAVE_MIGRATIONS` (de cada versión a la siguiente, solo para campos que cambian de nombre o de
  significado) y después un rescate campo a campo: dinero, tickets, trozos, Pokédex (vistos, capturados, favoritos),
  piezas, compras (mejoras, tipos de rancho, piedras), rutas desbloqueadas y completadas, equipo, expediciones,
  premios pendientes, rachas… Cada campo con regla propia (`RULES`) se valida a fondo (una especie, ruta o piedra que
  ya no existe se descarta); los demás se conservan si tienen la misma forma que el inicial, y los nuevos toman su
  valor inicial. Al final se arreglan las relaciones (`linkUp`: Pokémon sin repetir, activo y expediciones de
  Pokémon que existen, capturados como vistos, rutas completadas como desbloqueadas, ranchos comprados). Lo que
  está a medias (`IN_PROGRESS`: la ruta, las salas de raid, la incursión en curso o en cola y la torre) sigue si su forma
  no ha cambiado desde la versión guardada (`core/progressCarry.ts › CARRIED_SINCE`, y lo que nombra sigue existiendo);
  si no, se descarta y el Pokémon vuelve al rancho. Lo ganado en la ruta ya está sumado y la llave de la incursión se devuelve, así que jugar sin conexión con
  la versión anterior y actualizar después no quita nada.
- Las expediciones en curso **nunca se pierden** al cambiar de versión ni al cargar: cada una guarda al salir sus
  condiciones (`Expedition.terms`: niveles y salvajes de la ruta, combates y multiplicadores) y termina con ellas;
  los cambios de reglas o de rutas valen para las siguientes. En las dos cargas, `team/expeditionSalvage.ts ›
  repairExpeditions` deja terminables las de partidas antiguas o con una ruta, duración o enfoque que ya no existen
  (sin condiciones, las de su ruta ahora o, si ya no está o no tiene salvajes, las de la más avanzada que haya
  completado el jugador). Solo se quitan las de un Pokémon que ya no existe, repetidas o ilegibles.
- En las dos cargas se abren las rutas que desbloquean las ya completadas (`run/routeUnlocks.ts ›
  unlockReachedRoutes`): una ruta añadida al final del mapa aparece abierta para quien ya completó la anterior.
  También se da por capturada la línea evolutiva anterior de lo capturado (`collection/dex.ts › markEvolutionLines`);
  el servidor hace lo mismo al leer una partida de la nube (`worker/db/saves.ts › loadSave`, con
  `cloudSave.ts › withEvolutionLines`), así las partidas de antes de esta regla salen bien en cualquier dispositivo.
- Cualquier cambio en la forma de `GameState`, `OwnedMon`, `Run` o `Expedition` obliga a subir la versión. Si un
  campo cambia de nombre o de significado, se añade su paso en `SAVE_MIGRATIONS` con su test.
- **Red de seguridad**: cada guardado escribe también `pokerancho-team` (`teamBackup.ts`: los Pokémon, el activo,
  sus expediciones, las ampliaciones de los ranchos y la hora). Solo se usa si la partida guardada no se puede leer o se ha quedado sin Pokémon.
  Reiniciar desde ⚙️ guarda la copia vacía y se empieza de verdad desde el tutorial. Lo que se le añada a
  `TeamBackup` va opcional para que las copias ya guardadas sigan valiendo.

## Bucle de tiempo

`App.tsx` llama a `tick(s, Date.now(), battleHold)` (`core/tick.ts`) cada 250 ms. `battleHold` (`ui/route/foeReady.ts`) dice qué
combate (de la ruta o de la torre) espera porque su pantalla aún no tiene la imagen del rival: mientras, su tiempo no
corre y tu Pokémon sigue andando en la escena (como mucho 5 s; con la app cerrada no espera nadie). `tick` calcula el tiempo transcurrido (máx. 12 h para el
progreso offline), lo multiplica por `timeScale` (x1 en producción; el botón ⏱ para cambiarlo solo existe en `npm run dev`) y:

1. avanza la run en curso (`advanceRun`) con el tiempo real: si hay combate lo gasta en él y si no lo convierte
   en pasos (con `timeScale`). Puede cruzar varias paradas y combates de una vez;
2. avanza las expediciones (`advanceExpeditions`);
3. regenera PS de los Pokémon que están en el rancho (`restInRanch`).

## Ciclo de una run

```
RouteStartDialog (camino principal, pathFrom) → startRun(routeId, path) → 'walking'
  → (pasos) → llegada a parada de curación → drinkStopPotion: cura → Run.heal (se para heal.msLeft; si es la última, completeRoute)
  → (pasos) → llegada a parada → startStopBattle: combate simulado → lastBattle, battleMsLeft
      → (pasa battleMsLeft; no hay pasos) → settleBattle aplica PS y premio
          → derrota: 'fainted'
          → última parada: completeRoute → 'complete'
          → si no: sigue 'walking'
  → endRun (al volver al rancho o abandonando)
  → restartRun (desde «Abandonar»): endRun + startRun de la misma ruta, con paradas y rivales sorteados de nuevo
```

El motor **nunca espera a la UI**: el combate se resuelve entero al llegar (`simulateBattle` devuelve la lista
de eventos) y dura un tiempo fijo (`game/run/battleTimeline.ts › battleDuration`: lo de cada evento según su tipo en
`BATTLE_EVENT_MS` + `BATTLE_END_MS`). Cada evento lleva los PS y el estado alterado de ambos en ese momento y, si hace
falta, el crítico, la eficacia o por qué falló, para que la UI no tenga que leer el texto. Mientras
`run.battleMsLeft > 0` no se dan pasos; al llegar a 0 se aplica el resultado, así el estado no se adelanta a lo
que se ve. Tocar la escena (`tapRun`) salta al siguiente evento (`battleMoment`). `RunView` solo calcula qué evento toca
mostrar a partir de `battleMsLeft` (`ui/route/battleFrame.ts`) y `RouteBattle` lo pinta sobre la escena: nombre del
ataque, barras con su estado, números (`BattlePop`) y efecto del tipo (`HitEffect`). Con la app
cerrada el tiempo de los combates se consume igual y no se reproducen.

## Expediciones

`sendExpedition` guarda `{ uid, routeId, durationMin, elapsedMin }`. El tiempo avanza en `tick` y, al terminar,
`collectExpedition` simula los combates de forma resumida (probabilidad de victoria, sin turnos) y entrega el
premio. Un Pokémon en ruta, de expedición o en la Caja no se puede gestionar en el rancho (`monPlace`); los dos
primeros siguen ocupando su hueco en su rancho (`OwnedMon.ranch`).

## Jefes comunitarios

- **Calendario** (`raidSchedule.ts`): la hora real se parte en ciclos de una hora, iguales en todos los móviles y en el
  servidor sin guardar nada: 30 min de sala abierta y 30 de pelea. El jefe de cada ciclo y rotación lo da
  `rotationBosses.ts › cycleBoss` (la difícil, al azar con la semilla del ciclo).
- **La sala** (`RaidRoom`, la misma en la partida y en el servidor): los Pokémon de los jugadores (`entrants`, con su
  `MemberState` de incursión y su ataque), una semilla y la pelea (`fight`, un `GroupPlan` de incursión). Los bots no
  se guardan: salen de la semilla (`roomBots`) y, con la sala abierta, se ven los que han llegado a esa hora sin pasar
  de los huecos (`shownBots`). A su hora, `startFight` mete a los jugadores y completa con bots hasta 10.
- **La pelea es una incursión de una sala** (`raidFight.ts › raidSource`): el motor de incursiones juega cualquier
  `FightSource` (las salas, premios, revivires y límite de tiempo de una incursión o de un jefe de raid), así que la
  pelea se simula, se cierran sus ventanas de toques (`settleGroupTaps`) y se reproduce igual que un tramo de incursión
  (`groupProgress`), con las órdenes de cada turno (toques, cambios de ataque y, solo aquí, críticos: `TurnOrders.crits`).
- **En la partida** (`GameState.raids`, un `TabRaid` por rotación): `joinRaid` sienta al Pokémon en la sala local
  (`link: Joining`) y `net/raidSync.ts` pide sitio al servidor; con su respuesta (`applyRoomView`) la sala es su
  reflejo (`Online`, con las horas pasadas al reloj del móvil). Sin servidor (o si deja de tenerla, `dropRoom`) se
  sigue en local (`Local`): `raidPlay.ts › advanceRaids` empieza la pelea a su hora y cierra las ventanas pasadas con lo
  que tuviera el jugador decidido, también con la app cerrada. Terminada, `collectRaid` cobra (`fightPrize`, por la parte
  del jefe quitada) y el Pokémon vuelve al rancho; si nadie la recoge, al acabar el ciclo el premio va a
  `GameState.raidPrizes` (Notificaciones). Salir con la sala abierta deja su id en `GameState.roomsToLeave` hasta que
  el servidor lo sabe.
- **Paradas de ruta** (`NodeKind.Raid`): un combate de jefe de la ruta más (`startStopBattle`); al ganarlo,
  `settleBattle` suma el premio de raid de la parada (`routeRaid.ts › winRouteRaid`, con la racha de `routeRaidStreak.ts`)
  a lo ganado en la ruta. No tienen sala ni pasan por el servidor.

### Salas con servidor

Paso a paso del despliegue y del consumo del plan gratuito: [servidor.md](servidor.md).

- **El servidor no juega la pelea.** `worker/raid.ts` (`POST /api/raid`) guarda cada sala en D1 (`SharedRaid`: la sala
  de siempre más el asiento de cada jugador y lo que han decidido para la próxima ventana) y, en cada petición, la pone
  al día (`advanceShared`): a su hora empieza la pelea y cada ventana de toques ya pasada (más `TAP_CLOSE_DELAY_MS`) se
  cierra con lo que llegó a tiempo. Cada móvil simula la pelea igual con esas órdenes y la misma semilla.
- **Entrar** (`Join`): solo con la sala abierta; la sala en la que ya está el jugador, la que tenga más jugadores con
  sitio o una nueva (`roomFor`); al llenarse, el último bot en llegar se va. Volver a entrar cambia su Pokémon o su
  ataque. Al sentarse por primera vez se programa el aviso push de cuando empiece la pelea (`raidPushes.ts`).
- **Sin cuentas.** Cada dispositivo tiene un id anónimo y un apodo (`net/identity.ts`, en `localStorage` aparte de
  la partida). Cada uno ve la sala sin los ids de los demás (`roomView`).
- **La pestaña** (`Board`, `net/raidBoard.ts`): cuántos jugadores y salas hay en el ciclo de cada rotación (columna
  `players` de `rooms`) y la hora del servidor, con la que se cuentan las esperas.
- **Ranking de daño**: al terminar la pelea, quien guarda la sala apunta una sola vez el daño de cada jugador al jefe
  (`damageTally.ts`). La tarea programada borra las salas de ciclos ya jugados (`deleteOldRooms`).
- **Concurrencia**: cada sala lleva una versión; la escritura es `UPDATE … WHERE version = <la leída>` y, si otro
  jugador escribió antes, no cambia nada y se repite la petición entera (hasta 5 veces).

## Cuentas y partida en la nube

Opcionales, con email y contraseña, en el propio Worker (`worker/auth/`, tablas `users`, `sessions` y
`auth_tokens`). Paso a paso de Brevo y del despliegue: [servidor.md](servidor.md).

- **Contraseñas** con PBKDF2-SHA256 (`worker/auth/crypto.ts`); cada hash guarda sus iteraciones. Tras 10 fallos
  seguidos la cuenta se bloquea 15 min.
- **Sesión** en una cookie `HttpOnly` (`pkr_session`, solo para `/api`) con un token al azar; en la base de datos
  solo está su hash. Todas las peticiones que cambian algo comprueban que vienen de la propia web (`sameOrigin`).
- **Correos** con Brevo (`worker/mail.ts`): confirmar la cuenta (48 h) y recuperar la contraseña (1 h). El enlace
  lleva a la web con el token tras el `#` (`#confirm=…`, `#reset=…`); `net/account.ts` lo manda a la API al abrir
  la app y lo quita de la dirección. Sin confirmar no se puede entrar. Como mucho un correo por minuto y cuenta.
- **Una partida por cuenta** (tabla `saves`): `CloudSave` = la partida, la copia del equipo (por si es de otra
  `SAVE_VERSION`) y una revisión. Se sube encima de la revisión que el dispositivo vio por última vez (`CloudLink`, en
  `localStorage` aparte de la partida) con `UPDATE … WHERE revision = <base>`; si en la nube hay otra más nueva, el
  servidor responde 409 con ella y el dispositivo la carga (`replaceState`), salvo que aquí haya progreso que esa no
  tiene (`hasUnsavedProgress`: Pokémon que no están o con más nivel o ★, rutas completadas): entonces pregunta.
- **Al conectar** (`cloudAction`): sin copia, se sube; si la de aquí ya es de la cuenta, se baja si hay revisión nueva
  (o se pregunta si aquí hay progreso sin subir, p. ej. tras jugar sin conexión) y si no se sube; si no, se pregunta
  cuál conservar (salvo que la de aquí esté sin empezar).
- **Versiones de la app**: una app sin actualizar no sabe leer entera una partida guardada por una más nueva (perdería
  las especies o campos que no conoce). Por eso el servidor no acepta subir una partida de `SAVE_VERSION` más vieja que
  la de la nube (409 con `SaveRejection.OutdatedApp`) y el móvil no carga una de la nube más nueva (`isFromNewerApp`):
  deja de sincronizar (`net/cloudState.ts › outdated`) y pide actualizar (`ui/account/OutdatedAppDialog`). Lo jugado
  aquí sigue en `localStorage`; al actualizar se migra y se sube (o se pregunta, si la nube también avanzó).
- **Copias** (tabla `save_history`): antes de cambiar la partida de la nube se guarda la que había, como mucho una por
  hora y durante 3 días (`worker/db/saves.ts`), para recuperar algo a mano (ver [servidor.md](servidor.md)).
- **Obsequio diario** (`game/collection/dailyGift.ts`, `worker/gift.ts`, tabla `daily_gifts`): por cuenta, en el
  servidor, para que no se recoja dos veces desde dos móviles. Se guarda cuántos lleva y cuándo fue el último; recoger
  es una sola consulta (`INSERT … ON CONFLICT DO UPDATE … WHERE last_claim_at <= ahora − 24 h RETURNING`). El cliente
  (`net/dailyGift.ts`) suma el obsequio a la partida (`applyGift`) y la sube enseguida a la nube.
- **Intercambios** (`game/trade/`, `worker/trade.ts`, tablas `trade_listings` y `trade_inbox`): todo lo que cambia la
  partida se hace **sobre la partida de la nube**. El móvil sube la suya (`withCloudInSync`) y pide la operación encima
  de esa revisión; el servidor aplica la misma función pura (`applyTradeOp`) a la partida de la nube y la guarda junto
  con el anuncio en un solo lote (`worker/db/tradeWrites.ts`), donde cada paso solo se hace si el anterior se hizo:
  dos compradores no pueden quedarse el mismo anuncio y no puede quedar un anuncio sin la partida cambiada. Responde
  con la operación y el móvil la repite sobre la suya (si se pierde la respuesta, al volver se baja la de la nube).
  Cada operación sube `GameState.tradeStamp`; la columna `saves.trade_stamp` impide subir una partida con un sello más
  viejo (una copia restaurada o elegir la de este dispositivo): se carga la de la nube. Lo que se recibe va a
  `trade_inbox` y se recoge con otra operación; caducar (24 h, también en el cron) y retirar no tocan la partida.
- **Raids**: con sesión, el id de jugador es el de la cuenta (`setAccountId`), así los asientos son los mismos en
  cualquier dispositivo; al cambiar de id, `raidSync` saca de las salas los asientos del anterior. El apodo se guarda
  también en la cuenta.

## Notificaciones

Push estándar (Web Push) desde el Worker: llegan aunque la app esté cerrada. Cada aviso es de un tema
(`PushTopic`: expedición, ruta, obsequio, raids, intercambios) que el jugador activa por separado en Ajustes › Notificaciones
(`ui/settings/NotificationsDialog.tsx`), con un botón para todos.

- **Suscripción** (`net/push.ts`): con permiso, el navegador se suscribe con la clave pública VAPID del servidor
  (`GET /api/push/key`) y la suscripción se guarda en D1 (`push_subscriptions`) con sus temas, el id de jugador de las
  raids y la cuenta si la hay. Va por dispositivo; la preferencia, en `localStorage` (`pokerancho-push`).
- **Avisos que programa el móvil** (`game/core/pushPlan.ts`): la vuelta de cada expedición (hora exacta) y el fin de
  la ruta (`predictRunEnd`: simula la partida hacia delante sobre una copia con `tick`; es una estimación). Se mandan
  al servidor al pasar la app a segundo plano (`POST /api/push/jobs`) y se vacían al volver.
- **Avisos que decide el servidor**: el obsequio (al recogerlo se programa el siguiente, `push/notify.ts`) y las
  raids (`game/raid/online/raidPushes.ts`: cae un jefe con el jugador dentro, su Pokémon gasta sus vidas, se escapa, aparece el siguiente), al
  ver lo que pasa en las salas (`updateCycle` devuelve `pushes`). Al jugador de la petición no se le avisa.
- **Envío** (`worker/push/`): la tarea programada (`worker/scheduled.ts`, cron cada minuto) pone al día las raids sin
  nadie mirando y manda como mucho `SENDS_PER_RUN` avisos que ya tocan (`push_jobs`), firmados con VAPID y
  cifrados para cada navegador (`webPush.ts`, RFC 8292 y 8291, con la Web Crypto del Worker). Si el servicio de push
  responde 404/410, la suscripción se borra.
- **Versiones nuevas** (`net/appUpdate.ts`): el service worker va con `registerType: 'prompt'`. La versión nueva se
  descarga y espera; `UpdatePrompt` avisa para recargar («Más tarde» lo vuelve a enseñar al volver a la app). Con la
  app abierta se mira si hay versión nueva cada `UPDATE_CHECK_MS` y al volver a ella.
- `public/sw-notifications.js` se importa en el service worker de Workbox: enseña el aviso y, al tocarlo, abre o trae
  al frente la app. Requisitos: HTTPS (o `localhost`) y, en iOS, la app instalada en la pantalla de inicio (16.4+).

