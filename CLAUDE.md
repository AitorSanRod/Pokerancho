# Pokérancho

**Responde siempre en español** (preguntas, avisos y resúmenes finales).

Juego idle tipo digivice: el jugador elige el camino antes de salir y su Pokémon recorre la ruta y combate solo.
En el rancho ve a todo su equipo, cura, entrena y elige compañero; manda al resto de expedición y consigue
Pokémon nuevos juntando piezas del gacha. PWA para móvil en vertical.

Stack: Vite 8 + React 19 + TypeScript 7 + Vitest. La partida se guarda en `localStorage`; por servidor (un Worker de
Cloudflare con D1, `worker/`) van las salas de los jefes comunitarios y, con cuenta opcional (email y contraseña,
correos con Brevo), la partida en la nube. Sin servidor se juega todo en local.

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run check      # typecheck + lint + tests (lo que debe pasar antes de dar algo por terminado)
npm test           # solo tests (vitest run)
npm run build      # build de producción
npm run preview    # build + Worker de Cloudflare en local (http://localhost:8787; antes: npm run db:migrate:local)
npm run deploy     # publicar a mano (normalmente despliega Cloudflare solo con cada push)
```

Requiere Node `>=22.13` (ver `.nvmrc`): los tests del Worker usan `node:sqlite`, y con versiones anteriores npm
tampoco instala los binarios nativos de Vite/oxlint.

## Arquitectura en una línea

`src/data` (datos estáticos) → `src/game` (lógica pura, sin React ni DOM) → `src/net` (conexión con el servidor) →
`src/ui` (pantallas React); `worker/` (servidor) usa `src/game` y `src/data`. Las dependencias solo van en ese
sentido. `src/game` y `src/data` corren también en el servidor: nada de DOM ni de `import` de imágenes. `src/game` se agrupa por dominio (`core`, `battle`, `run`, `team`,
`collection`) y `src/ui` por pantalla, cada una con su CSS. Detalle en [docs/arquitectura.md](docs/arquitectura.md).

## Cómo orientarse sin leer todo el programa

Este mapa basta para empezar: **no explores el proyecto entero**. Abre solo los ficheros de la fila que toque y
localiza lo demás con `Grep` por el nombre del símbolo. `docs/` se consulta cuando hace falta, no por sistema.
Cada `.ts` de `src/game` tiene su `.test.ts` al lado; las pantallas, su CSS en la misma carpeta.

| Quiero cambiar… | Dónde (`src/`) |
|---|---|
| Rutas, paradas, encuentros, jefes, premio de ruta, imagen de la lista (`backdrop`, con `asset(new URL(…))`) | `data/maps/kantoMaps.ts` (un fichero por región) |
| Tipos de parada y biomas, ids de ruta, atajos y consultas de caminos | `data/maps/mapCommon.ts` |
| Lista de regiones y `route(id)` | `data/maps/index.ts` |
| Especies, rarezas, iniciales, evoluciones | `data/species.ts`, `data/evolutions.ts` |
| Ataques, tipos y eficacias | `data/moves.ts`, `data/types.ts` |
| Forma de la partida, estado inicial, `SAVE_VERSION` | `game/core/state.ts` |
| Guardado, migrar partidas de otra versión y copia del equipo | `game/core/store.ts`, `game/core/saveMigration.ts`, `game/core/teamBackup.ts` |
| Paso del tiempo | `game/core/tick.ts`, `App.tsx` |
| Combate (turnos, daño) y sus premios / cuánto dura cada evento en pantalla | `game/battle/battle.ts`, `attack.ts`, `status.ts`, `rewards.ts` / `game/run/battleTimeline.ts` |
| Pasivas de rancho y estados alterados (números a mano) | `data/passives.ts` + `game/team/ranchPassives.ts`, `game/battle/combatBonus.ts` + `ui/ranch/PassiveList.tsx` |
| Tipos de rancho (lista a mano) | `data/ranchTypes.ts` + `game/team/ranchTypes.ts` + `ui/shop/RanchTypeShop.tsx`, `ui/ranch/RanchTypeSection.tsx` |
| Rutas que abre lo ya completado, al cargar la partida (rutas añadidas después) | `game/run/routeUnlocks.ts` |
| Avance por la ruta / combates dentro de la ruta / paradas de curación (pociones) / elemento de la parada en la escena (`landmark` del nodo) | `game/run/run.ts` / `game/run/runBattle.ts` / `game/run/runHeal.ts` + `data/potions.ts` + `ui/route/HealStop.tsx` / `game/run/runLandmark.ts` + `landmarks` de `ui/route/pixelScene/scenes/<bioma>/index.ts` |
| Stats, EXP, niveles, ★, pasos / naturalezas (qué stat sube y cuál baja) | `game/team/stats.ts` / `data/natures.ts` + `game/team/natures.ts` (`createMon` la recibe; al azar, en `collection/pieces.ts › combine`; la Menta aleatoria de la tienda la cambia: `game/team/mints.ts` + `ui/shop/MintShop.tsx`, `ui/shared/sheet/MintPanel.tsx`, Mochila) |
| Curar, entrenar, elegir activo, descanso | `game/team/ranch.ts` + `ui/shared/sheet/HealButton.tsx`, `CompanionButton.tsx`, `CareSection.tsx`, `TrainControl.tsx` |
| Ficha del Pokémon, un solo componente para rancho y Pokédex: paisaje por tipo, arco de EXP, PS, secciones | `ui/shared/sheet/` (`PokemonSheet` (la ficha), `MonSheet` + `MonSection`, `SpeciesHero`, `CareSection`, `MovePanel`, `MonOverview` (Datos) + `MovesInfo` (la «i» del ataque: todos sus ataques de ruta e incursión), `TicketsSection`, `FavoriteButton` (corazón de la cabecera), `CompanionButton` (Poké Ball de compañero, esquina izquierda), `HealButton` (poción de curar, abajo a la izquierda), `RanchSlotsBadge` (espacios que ocupa en el rancho, abajo a la derecha), `CombineResultAnimation`, `HeroLayout`, `MonHero`, `LevelUpBurst`, `StepperAction` (− / + de entrenar y crear tickets), `scenery.ts`) |
| Formas (Rotom): objetos de forma de la tienda (se compran una vez, no se gastan) / cambiar de forma en la ficha | `data/forms.ts` + `game/team/forms.ts` (las formas son especies con `baseId`, fuera de `SPECIES`: `baseSpeciesOf`, `ownedOfSpecies` en `core/state.ts`) / `ui/shop/FormItemShop.tsx`, `ui/shared/sheet/FormPanel.tsx`, Mochila |
| Animación de crear y evolucionar | `ui/shared/sheet/EvolutionAnimation.tsx` |
| Espacios, varios ranchos, Caja, arrastrar / nombre de cada rancho / fondo de cada rancho (lo elige el jugador; imágenes en `assets/ranches/`) | `game/team/ranches.ts` + `ui/ranch/RanchMon`, `RanchSlots` (panel del rancho, arriba a la izquierda), `BoxSheet` + `ui/shared/sheet/MovePanel` / `game/team/ranchNames.ts` + `ui/ranch/RanchRenameDialog.tsx` / `data/ranchBackdrops.ts` + `game/team/ranchBackdrops.ts` + `ui/ranch/ranchLooks.ts` (imagen de cada fondo y tono del de por defecto), `RanchBackdropPicker.tsx` |
| Evolución (por nivel o con un objeto evolutivo) / objetos evolutivos de la tienda (piedras, armaduras, Escama Bella; cada uno con su precio) | `data/evolutions.ts`, `game/team/evolution.ts` + `ui/shared/sheet/EvolvePanel.tsx` / `data/stones.ts`, `game/team/stones.ts` + `ui/shop/StoneShop.tsx` |
| Expediciones | `game/team/expedition.ts` + `ui/expeditions/` (`ExpeditionScreen` lista de rutas, `ExpeditionList` las que están en curso, `ExpeditionStartDialog` elegir Pokémon y duración; el selector es `ui/shared/MonPicker.tsx`) |
| Jefes comunitarios: jefes (`RAID_BOSSES` en orden, `HARD_RAID_BOSSES` difíciles) y premios / rondas, bots, reparto / pantalla | `data/raidBosses.ts` / `game/raid/` (`raidEngine` común, `rotationBosses` lista de jefes de cada rotación, `raidEnding` final de la pelea: última ronda y cierre antes de aplicar el resultado, `raidLives` vidas de la pestaña Raids (al gastarlas sale y cobra), `raidBossStatus` estados alterados del jefe (duran hasta que cae, salvo sueño y congelación), `raid` pestaña Raids, `routeRaid` paradas de ruta, `routeRaidStreak` menos dinero al repetirlas seguidas, `stopRoom` salas de parada sin la partida, `raidCombat`, `raidBots`, `raidPrizes`, `raidEstimate`, `raidRoom`); el jefe de una ruta es una parada `NodeKind.Raid` en `kantoMaps.ts` / `ui/raid/` (`RaidScreen`, `RaidScene`, `RaidWaiting` (espera entre jefes), `raidBiome`, `RaidBattleScene` (la pelea como un combate de ruta; `RaidFinale` + `raid-finale.css` cartel del final; `fallText` cuándo cae el jefe) + `partySpot` (filas desordenadas del grupo) + `roundReplay` (los golpes, uno tras otro), `RaidRoster` (lista de la sala: jugador, jugadores y bots, en líneas como las de ruta), `RaidJoin` (tu Pokémon en la sala o elegir entre los que pueden ir), `RaidPrizes` aviso de premios por recoger + `useRaidPrizeCollect` recogerlos; también, uno a uno, en Notificaciones: `ui/inbox/`) y, en la ruta, la misma `RunView` con `RaidBattle` dentro de su escena y `ui/route/RouteRaidHud.tsx` (línea del jefe, que abre la lista de la sala, «Retirarse» y la espera mientras se busca sala) |
| Salas compartidas con otros jugadores: protocolo / lo que hace el servidor / la sala de la partida enlazada / conexión, apodo y cada cuánto se consulta / función y almacén | `game/raid/online/` (`protocol`, `sharedRoom` + `roomServer` + `requests`, `linkedRoom`, `skipAhead` resumir salas viejas, `raidCycle` + `tabRooms` los jefes de la pestaña Raids: dos rotaciones, en orden y difíciles, por ciclos) / `net/` (`raidSync`, `raidFeed` la pestaña Raids del servidor, `identity`, `raidApi`) + `ui/raid/` (`RaidScreen` una pestaña por rotación y Salas, `RaidFront` frontal de una rotación con servidor, `rotations` nombre de cada rotación, `RaidRooms` pestaña Salas, `RaidLocal` sin servidor, `NicknameDialog`, `RaidLinkNote`) / `../worker/raid.ts`, `../worker/raidTab.ts`, `../worker/db/rooms.ts`, `../worker/db/cycle.ts`, `../wrangler.jsonc` (despliegue: `docs/servidor.md`) |
| Cuenta opcional y partida en la nube: reglas compartidas y subir o bajar (progreso sin subir, app sin actualizar) / sesión y correos / subir y bajar + lo que ve la UI / pantallas / servidor (rechazo por versión y copias en `save_history`) | `game/core/accountRules.ts`, `cloudSave.ts` / `net/account.ts` / `net/cloudSync.ts` + `net/cloudState.ts` / `ui/account/` (`AccountDialog`, `AccountHost`, `CloudChoiceDialog` elegir entre dos partidas, `OutdatedAppDialog` actualizar para seguir guardando, `AccountModal`) / `../worker/auth/`, `../worker/save.ts`, `../worker/db/` (`saves.ts`), `../worker/mail.ts` (texto de los correos) |
| Obsequio diario (₽, trozos, tickets y objetos estelares): lista de días (a mano) / reglas / servidor / cliente / pantalla y menú del rancho | `data/dailyGifts.ts` / `game/collection/dailyGift.ts` / `../worker/gift.ts`, `../worker/db/gifts.ts` / `net/dailyGift.ts` / `ui/gift/DailyGiftSheet.tsx`, `GiftPrompt.tsx`, `giftText.ts` (aviso al entrar, desde `ui/account/AccountHost`), `ui/ranch/RanchMenu.tsx` (botón Menú, abajo a la derecha, con obsequio, Mochila, Ranking y Tutoriales; la cabecera de sus paneles, `MenuSheetHeader`; la Caja, abajo a la izquierda) |
| Intercambios entre jugadores: reglas y límites / lo que sale y entra (repetidos) / operaciones que aplican servidor y móvil / tablón y peticiones / textos / cliente / pantallas / servidor | `game/trade/tradeGoods.ts` / `tradeGive.ts`, `tradeReceive.ts` / `tradeOps.ts` / `tradeProtocol.ts` / `goodText.ts` / `net/tradeApi.ts`, `net/tradeBoard.ts` (cada minuto; contador de Notificaciones), `net/cloudSync.ts › withCloudInSync` / `ui/shop/ShopScreen.tsx` (pestañas Tienda, Intercambios, Venta) + `ui/trade/` (`TradeScreen`, `TradeBoardView` tablón con buscador, `MyListings`, `NewListingDialog` + `OfferPicker` + `AskPicker`, `AcceptDialog`, `ListingCard`, `GoodBadge`, `CountInput` cantidad escrita a mano + `correctionGuard`, `SpeciesSearch` + `speciesMatch`) / `../worker/trade.ts`, `../worker/tradeActions.ts`, `../worker/db/trades.ts`, `../worker/db/tradeWrites.ts`, `saves.ts` (sello de intercambios) |
| Incursiones (mazmorras de 5; con otros jugadores por el servidor o, sin él, en local con bots): tipos, llaves y lista / cada incursión (una de prueba, corta) / ataques de incursión (potencia + efectos; daño, cura y estado) / repertorio por especie (`CUSTOM_MOVESETS`: el de una especie o forma a mano, en lugar del de sus tipos; y todos por nivel, en la ficha: la «i» del ataque) / pasivas de grupo / en la partida: entrar, avanzar con la hora, reorganizar, retirarse y cobrar / llaves / motor / con otros jugadores (protocolo, servidor, cliente) / pantallas | `data/incursions/` (`types` (con `MAX_ROOM_FOES`, rivales por sala), `index`, `incursions.test` lo comprueba) / `prueba.ts`, `bosqueVerde.ts`, `cuevaHelada.ts` / `data/incursionMoves/` (`effects` efectos y clases, `damage`, `support`, `catalog/` catálogo de los juegos, un fichero por tipo, + `catalogMove` mejora de precisión, `index` `IMOVE`) / `data/learnsets.ts` + `game/incursion/repertoire.ts` + `ui/shared/sheet/MovesInfo.tsx` / `data/incursionPassives.ts` + `game/incursion/groupPassives.ts` / `game/incursion/incursionGame.ts` + `activeIncursion.ts` (lo guardado y por dónde va) / `game/incursion/keys.ts` + `ui/shop/IncursionKeyShop.tsx`, Mochila; gratuitas (`free`: sin llave, premios solo la primera vez): `game/incursion/freeIncursions.ts` / `game/incursion/` (`entry` nivel mínimo y máximo para entrar, `incursionRun` tramos y retirada, `incursionLeg` un tramo, `foePool` rivales al azar de una lista (`oneOf`, `weighted` en `data/incursions/types.ts`), `groupBattle`, `moveEffects` + `targeting`, `healing` potencia → PS, `statStages` etapas de stats (±6), `foeTactics` qué ataque usa cada rival de los suyos, `groupStatus`, `bossMechanics`, `revives`, `restRooms`, `movePicks` + `incursionPicks` cambiar ataque y objetivo en plena pelea, `party` bots, `incursionRewards`, `incursionTimeline`, `retreatVote`, `tapWindow` toques antes de cada turno + `tapSettle` cerrar las ventanas pasadas, `damageTally` daño de cada uno en toda la incursión; diseño en `docs/incursiones.md`) / con otros jugadores: protocolo, reglas del servidor y la partida enlazada / cliente / servidor: `game/incursion/online/` (`protocol`, `requests`, `sharedIncursion` cola y grupo, `linkedIncursion` cola de la partida y aplicar lo del servidor) / `net/incursionApi.ts`, `net/incursionSync.ts` / `../worker/incursion.ts`, `../worker/db/incursions.ts`, `../migrations/0010_incursions.sql` / `ui/incursion/` (`IncursionScreen` pestaña Ruta › Incursiones, `IncursionQueueView` buscando grupo, `RetreatVote`, `IncursionList` + `IncursionInfo` información + `IncursionPrep` Pokémon y movimiento, `MovePicker` + `ui/shared/moveText`, `IncursionView` en curso, a pantalla completa como una ruta (cabecera encima con la sala, los PS y el botón «Menú»), `TapPad` ventana de toques, `PickButton` + `PickDialog` cambiar ataque y objetivo, `IncursionStage` escena como un combate de ruta (`stageSpots` el grupo a la izquierda y los rivales a la derecha; marcadores `BattleHud` de tu Pokémon y del rival en juego) + `StageFighter` cada Pokémon (nombre del ataque, golpes, estados) + `StagePop` números flotantes (curas en verde) + `MoveBanner` el ataque que se usa, arriba en el centro + `incursion-stage.css`, `sceneState` cómo está en cada momento, `IncursionStrip` franja con los PS de todos (en la cabecera), `IncursionMenu` botón «Menú» y su panel: tu ataque y `Fold` plegables (`IncursionRoster`, `DamageTally` quién hace más daño, `memberNote` tú, bot o apodo, `GroupPassiveList` pasivas con su descripción, retirada), `RegroupPanel`, `IncursionSummary`) |
| Venta al servidor (precios por rareza) | `game/trade/serverSale.ts` + `ui/sell/` (`SellScreen`, `SellCountDialog`) |
| Notificaciones del menú (obsequio listo, regalos del servidor para todos o para un jugador (llaves y Pokémon, p. ej. para devolver lo perdido), cada premio de raid y lo de los intercambios; «Recoger todo»); los regalos: reglas / cliente / servidor (se ponen con una migración en `server_gifts`) | `game/collection/serverGifts.ts` / `net/serverGifts.ts` / `../worker/serverGifts.ts`; `ui/inbox/` (`InboxSheet`, `InboxRow` una fila, `useInboxCollect` recoger, `useInboxCount` contador del Menú), desde `ui/ranch/RanchMenu.tsx`; un premio suelto: `game/raid/raidPrizes.ts › collectRaidPrize` |
| MTs (un solo uso, enseñan un ataque de incursión para siempre a ciertos tipos; premio de incursión e intercambio, no se compran): lista / reglas (enseñar, lo que sabe cada Pokémon, lo que acepta el servidor) / ficha / intercambio | `data/tms.ts` / `game/incursion/tms.ts` + `repertoire.ts › monRepertoire` / `ui/shared/sheet/TmPanel.tsx` (sección «MT», solo si hay alguna que enseñar) / `game/trade/` (`GoodKind.Tm`) + `ui/trade/TmChoice.tsx` |
| Mochila (lo comprado y sin usar) | `game/team/bag.ts` + `ui/bag/BagSheet.tsx` |
| Rankings de dinero y de daño a jefes (cada hora; el de daño, semanal: de cero cada lunes, `damageWeek`; cuenta con apodo; «Aparecer en el ranking» en Ajustes vale para los dos): reglas / daño de una sala al terminar el jefe / daño a los jefes de una incursión al terminarla / servidor / cliente / pantalla | `game/core/ranking.ts` / `game/raid/online/damageTally.ts` (lo apunta `../worker/db/rooms.ts` al guardar o borrar la sala) / `game/incursion/online/bossDamage.ts` (lo apunta `../worker/incursion.ts` al guardar el grupo) / `../worker/ranking.ts`, `../worker/db/ranking.ts` (`refreshRanking` desde `scheduled.ts`), `../worker/db/damageRanking.ts`, `RANKED_USERS` en `../worker/db/users.ts` / `net/ranking.ts`, `net/account.ts › setRanked` / `ui/ranking/` (`RankingSheet` con pestañas Dinero y Daño a jefes, `RankingBoard` tablero común, `RankingBoards` los dos), desde `ui/ranch/RanchMenu.tsx` y `ui/settings/SettingsMenu.tsx` |
| Tutoriales del menú: guías paso a paso / capturas | `ui/tutorials/` (`TutorialsSheet` lista, `GuideView` pasos, `guides/` un fichero por guía) / `assets/tutorials/*.webp`, generadas con `npm run shots` (con `npm run dev` abierto; `../scripts/tutorial-shots/`: `demoSave` partida de muestra, `shots` lista de capturas; `hold` deja una petición sin respuesta, p. ej. para ver la cola de incursión) |
| Avisos (punto rojo o contador) que se apagan al entrar y vuelven si hay algo nuevo | `ui/shared/useUnseen.ts` |
| Desplegable con cabecera grande (Pokédex, Tienda, Gacha) | `ui/shared/Foldout.tsx` |
| Base de datos (tablas) | `../migrations/` (un fichero nuevo por cambio) |
| Mejoras de la tienda / Ampliación de rancho (+espacios en el rancho elegido) / secciones desplegables y casillas de la cuadrícula / botón de precio con confirmación antes de comprar | `game/team/upgrades.ts` + `ui/shop/UpgradeShop.tsx` / `game/team/ranchExpansion.ts` + `ui/shop/RanchExpansionTile.tsx` / `ui/shop/ShopTile.tsx` / `ui/shop/BuyButton.tsx` |
| Tutorial e inicial | `game/team/tutorial.ts` + `ui/starter/`, `ui/shared/TutorialHint.tsx` |
| Piezas, crear Pokémon y Pokédex (capturar cuenta para la línea evolutiva anterior: `dex.ts › markCaught`; buscador, orden y filtros: `dexQuery.ts`) | `game/collection/pieces.ts`, `dex.ts`, `dexQuery.ts` + `ui/dex/` (`DexScreen`, `DexToolbar` botones que despliegan el buscador y `DexFilters` (orden y filtro), `DexSection` el desplegable de cada Pokédex, `DexCell`; la ficha es `PokemonSheet`, la misma que el rancho) |
| Pokédex regionales y Nacional (rangos y mapa de cada región) | `data/pokedexes.ts`; las especies nuevas, en `NATIONAL_IDS` de `scripts/fetch-pokemon.mjs` + `data/pokemon.ts` |
| Objetos estelares (uno por rareza, para crear y evolucionar; en el gacha con garantía): lista y probabilidades / reglas / intercambio | `data/starItems.ts` / `game/collection/starItems.ts` / `game/trade/` (`GoodKind.StarItem`) + `ui/trade/StarItemChoice.tsx` |
| Gacha, trituradora, MissingNo | `game/collection/gacha.ts`, `shredder.ts` + `ui/gacha/` (`GachaScreen` pestañas, `GachaMachine` + `GachaRates` tirar y probabilidades (también de los objetos estelares), `Shredder` + `ShredCell` trituradora, `MissingnoShop` casillas de la Pokédex que abren `PokemonSheet`, `RarityFoldout` + `rarityTitles` desplegable por rareza) |
| Rancho (pasar de rancho como fotos de una galería, siguiendo al dedo: `ui/ranch/useRanchCarousel.ts` + `ui/shared/useSwipe.ts`) | `ui/ranch/RanchScreen.tsx`, `RanchPage.tsx` (un rancho: fondo y Pokémon), `RanchMon.tsx` + `useRanchPose.ts` (cada Pokémon alterna pasear con el sprite fijo y pararse con su GIF) |
| Pestañas de arriba de Ruta y Gacha (solo icono; la activa con su nombre) | `ui/shared/IconTabs.tsx` + `icon-tabs.css`; las de Ruta, en `ui/route/RouteScreen.tsx` |
| Pantalla de ruta: lista / línea de ruta (también en expediciones; con `onClick` la tarjeta entera es el botón; su base `BackdropRow`, también en la sala de un jefe) / diálogo de comenzar / en curso (arriba, `StopTrack`: mapa horizontal de las paradas, «?» en las que faltan) / combate | `ui/route/RouteMap`, `RouteRow`, `RouteStartDialog`, `RunView` + `StopTrack`, `RouteBattle` (nombre del ataque; `spriteSizes` tamaño del rival y del jefe, también en incursiones; `BattleHud` + `battle-hud.css` el marcador de cada combatiente, igual en los dos lados y a sus pies, también el del jefe comunitario: tipos, nivel, barra de PS, estado; `status-fx.css` el estado alterado sobre el sprite; `BattlePop` números flotantes; `battleFrame` qué evento toca; `battle-callouts.css`) |
| Escena de paseo / efectos de golpe (por tipo; los estados alterados usan el `type` de `STATUS_INFO`) | `ui/route/WalkScene.tsx` / `HitEffect.tsx` |
| Fondos de ruta por bioma (pixel art generado en canvas; Monte Moon tiene el suyo, `scenes/mtMoon/`) | `ui/route/pixelScene/` (`index.ts` bioma → escena, `usePixelScene`, `engine/`, `paint/`, `elements/`, `scenes/<bioma>/`) |
| Editor visual de rutas e incursiones: formulario que escribe el objeto de la ruta para `kantoMaps.ts` o el fichero de una incursión para `data/incursions/` (`/tools/route-editor/` con `npm run dev`, que lista las URLs de las herramientas: `../vite-plugins/toolUrls.ts`; carga lo del juego o lo pegado; «Guardar en el juego» escribe la incursión y da de alta las nuevas: `incursion/incWrite.ts` → `../vite-plugins/incursionWriter.ts` + `incursionFiles.ts`) | `tools/route-editor/` (`main` eventos y modo activo, `mode` lo que da cada modo + borrador guardado, `paths` campos por ruta y acciones de lista, `fields` piezas del formulario, `evalCode` + `pasteDialog` pegar; rutas: `routeMode`, `catalog` listas sacadas de los datos, `draft`, `codegen`, `checks` avisos, `paste`, `routeView` + `nodeView`; incursiones: `incursion/` (`incursionMode`, `incCatalog`, `incDraft`, `incCodegen`, `incChecks`, `incPaste`, `incWrite`, `incView` + `roomView` + `foeView`)) |
| Banco de pruebas de los fondos pixel art (`/tools/scenery-lab/` con `npm run dev`) | `tools/scenery-lab/` (skill `fondos-pixel-art`) |
| Menú inferior y pestañas / llevar a otra pestaña desde una pantalla (p. ej. «Comprar llave» → Tienda › Llaves) | `App.tsx` / `ui/shared/navigation.ts` |
| Versión nueva de la app: service worker, cada cuánto se mira y `reloadApp` (botón de la pantalla de error, `ui/shared/ErrorBoundary.tsx`) / aviso para recargar | `net/appUpdate.ts` (`registerType: 'prompt'` en `../vite.config.ts`) / `ui/shared/UpdatePrompt.tsx` |
| Barra superior / ajustes | `ui/shared/TopBar.tsx` / `ui/settings/` |
| Notificaciones push: temas y validación / plan del móvil (expediciones, fin de ruta) / avisos de raids / cliente / ajustes / servidor | `game/core/push.ts` / `game/core/pushPlan.ts` / `game/raid/online/raidPushes.ts` / `net/push.ts`, `../public/sw-notifications.js` / `ui/settings/NotificationsDialog.tsx` / `../worker/push/`, `../worker/scheduled.ts` (cron), claves con `../scripts/make-vapid-key.mjs` |
| Sprite, barras, chips de tipo y de ataque | `ui/shared/common.tsx` |
| Iconos (objetos de PokeAPI, sin emojis) | `ui/shared/icons.ts` (qué objeto es cada cosa), `ItemIcon.tsx`, `data/items.ts` |
| Premios a pantalla completa, aparición, confirmación | `ui/shared/RewardOverlay`, `RevealOverlay`, `ConfirmDialog` |
| Colores y variables / estructura / piezas comunes | `styles/tokens.css` / `layout.css` / `components.css` |
| Números de balance | tabla «Sistemas» de `docs/diseno.md` (dice la constante y el fichero) |

Diccionarios (nunca strings ni números sueltos): `PokeType` en `data/types.ts`; `POKEMON` y `POKEMON_FORM` (formas) en `data/pokemon.ts`; `FormItem` en `data/forms.ts`; `NodeKind`, `Biome`, `RouteId`, `StopLandmark` en
`data/maps/mapCommon.ts`; `Rarity` en `data/species.ts`; `Potion` en `data/potions.ts`; `StarItem` en `data/starItems.ts`; `Tm` en `data/tms.ts`; `TutorialStep`, `MonPlace` en `game/core/state.ts`; `CombineKind` en
`game/collection/pieces.ts`; `Stone` en `data/stones.ts`; `Nature` en `data/natures.ts`.

Si creas, mueves o cambias de función un fichero, actualiza esta tabla en el mismo cambio.

## Reglas que no se negocian

- **Código limpio antes que rápido.** Nombres claros, funciones cortas, sin código muerto ni comentarios obvios.
- **Ficheros pequeños.** Objetivo < 200 líneas; si un cambio lo supera, divide por responsabilidad.
- **La lógica del juego vive en `src/game`** y es pura: recibe el estado (y un `rng` inyectable) y lo modifica.
  La UI solo lee el estado y llama a acciones mediante `act()`.
- **Constantes de balance con nombre y `/** comentario */`** que explique la unidad y el efecto.
- **Cambios en `GameState`** ⇒ subir `SAVE_VERSION` en `src/game/core/state.ts`. **No se pierde nada**: la partida de la
  versión anterior se migra campo a campo (`core/saveMigration.ts`). Si un campo cambia de nombre o de significado,
  añade su paso en `SAVE_MIGRATIONS` (de la versión que dejas a la nueva) y su test en `saveMigration.test.ts`; si
  añades un campo con validación propia (ids de especie, ruta, objeto…), su regla en `RULES`.
- **Tests** para toda lógica nueva o modificada en `src/game` (`*.test.ts` junto al fichero).
- **Los tests no fijan contenido ni balance** (nombres, tiempos, números): usan `game/core/test-map.ts` y leen las
  constantes, para que editar datos a mano nunca rompa un test.
- Identificadores en inglés; comentarios, textos de UI y documentación en español. Excepción: las claves de los
  ataques de incursión (`IMOVE.Rayo`) y de las MT (`Tm.Senuelo`) van en español, como se ven en el juego, sin tildes ni ñ; su id guardado sigue en inglés.

Convenciones completas en [docs/convenciones.md](docs/convenciones.md).

## Documentación

- [docs/diseno.md](docs/diseno.md): reglas del juego, bucle principal y dónde está cada número de balance.
- [docs/arquitectura.md](docs/arquitectura.md): capas, estructura de carpetas, store, guardado, flujo de una ruta.
- [docs/convenciones.md](docs/convenciones.md): estilo de código, tests y checklist de revisión.
- [docs/fondos.md](docs/fondos.md): fondos pixel art de las rutas: estilo, motor, piezas y cómo crear uno nuevo.
- [docs/incursiones.md](docs/incursiones.md): diseño de las incursiones (mazmorras de 5): reglas, por tramos, plan por fases y lo que ya está hecho.
- [docs/servidor.md](docs/servidor.md): servidor en Cloudflare (plan gratuito): despliegue paso a paso, Brevo, base de datos y consumo.

Si cambias una mecánica o la estructura, actualiza el documento correspondiente en el mismo cambio.

## Skills del proyecto

Hay skills en `.claude/skills/` para las tareas habituales: `nuevo-contenido`, `nueva-mecanica`,
`nueva-pantalla`, `revision-limpia` y `fondos-pixel-art`. Úsalas cuando la tarea encaje.

## Fuera de alcance

Existe otro proyecto anterior (`poke/Game/pokeproject`) que **no forma parte de este proyecto**. No leerlo, copiarlo
ni tomarlo como referencia salvo que se pida explícitamente.
