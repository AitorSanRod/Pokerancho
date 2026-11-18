# Data Model: Ajustes varios

## GameState (`src/game/core/state.ts`)

| Campo | Tipo | Cambio | Notas |
|---|---|---|---|
| `mints` | `number` | sin cambios | Mentas aleatorias sin usar |
| `neutralMints` | `number` | **nuevo** | Mentas neutras sin usar; `initialState` = 0 |

- `SAVE_VERSION`: 65 → **66**.
- `saveMigration.ts › RULES`: `neutralMints: (v) => (isInt(v) ? v : undefined)`. Si el campo falta (partidas de la
  65), se queda el 0 de `initialState`. No hace falta paso en `SAVE_MIGRATIONS`: ningún campo cambia de nombre ni de
  significado.
- `CARRIED_SINCE`: sin cambios (ni `TowerRun` ni nada a medias cambia de forma).

## CloudLink (`src/game/core/cloudSave.ts`, guardado por `src/net/cloudLink.ts` en `localStorage`, fuera de la partida)

```ts
interface CloudLink {
  userId: string
  revision: number
  /** Lo que había aquí la última vez que se subió o se bajó; sin ella (enlaces de antes), regla de siempre */
  snapshot?: SyncSnapshot
}

/** Progreso de una partida en un momento: nivel y ★ de cada Pokémon por uid y rutas completadas */
interface SyncSnapshot {
  mons: Record<string, [level: number, stars: number]>
  routes: string[]
}
```

Reglas (puras, en `src/game/core/cloudChoice.ts`, nuevo, para no pasar `cloudSave.ts` de 200 líneas):

- `syncSnapshot(state): SyncSnapshot`.
- `progressSince(local, snapshot): boolean`: hay algún Pokémon que no está en la instantánea o con más nivel o ★, o
  alguna ruta completada que no está.
- `cloudAction(link, userId, cloud, local)` (en `cloudSave.ts`): igual que hoy, salvo en la rama «misma cuenta y la
  nube va por delante». Ahí, con `link.snapshot`, se pregunta solo si
  `progressSince(local, link.snapshot) && hasUnsavedProgress(local, cloud)`; si no, se baja. Sin instantánea, la regla
  de hoy.
- `recommendedSave(cloudUpdatedAt, localPlayedAt): SaveSide` (`SaveSide = { Cloud, Local }`): la que se jugó después;
  con empate, la de la nube.

Validación al leer el enlace: si `snapshot` no tiene la forma esperada, se ignora (como un enlace antiguo).

## Hora de juego al abrir (`src/store/`)

- `store.ts` expone `openedPlayedAt()`: el `lastTick` de la partida tal como se leyó del almacenamiento, antes del
  primer avance de tiempo. `cloudSync.ts` lo usa como «Jugada el» de aquí en la primera conexión tras abrir. Después
  usa `getState().lastTick`.

## Rareza (`src/data/species.ts › RARITY_INFO`)

| Campo | Cambio |
|---|---|
| `surplusMoney` | **se quita** |
| `ticketSalePrice` | **nuevo**: ₽ por ticket vendido (Venta y tickets sobrantes): 50 / 100 / 150 / 250 |

`serverSale.ts › PIECE_SALE_PRICE` se quita; `pieceSalePrice(id)` lee `ticketSalePrice`.
`pieces.ts › surplusMoney(id)` = `PIECES_PER_COMBINE × ticketSalePrice`.

## Favoritos (`src/game/trade/tradeGive.ts`)

```ts
const FavoritePolicy = { Protect: 'protect', Allow: 'allow' } as const
```

Lo reciben (último parámetro de datos, antes de `rng` si lo hubiera; por defecto `Protect`): `giveMonBlocker`,
`takeMon`, `givePiecesBlocker`, `serverSale.ts › sellMon`, `sellPieces` y `shredder.ts › shred`. Con `Allow` desaparece
solo el bloqueo de favorito. Nuevos `favoriteStock(s)` (tickets de especies favoritas) en `shredder.ts` y
`favoriteMons(s)` (Pokémon vendibles de especies favoritas) en `serverSale.ts`.

## Torre (`src/game/tower/towerRewards.ts`)

```ts
/** Recorte de la EXP de la torre según el nivel del Pokémon que sube, de mayor a menor nivel */
const TOWER_EXP_LEVEL_CUTS: { fromLevel: number; mult: number }[] // 90 → 0.75, 75 → 0.8, 50 → 0.9
towerExpMult(level: number): number // 1 por debajo del primer corte
```

`rewardFloor` cobra `Math.round(got.exp × towerExpMult(mon.level))` con el nivel de antes de sumar la EXP. Lo apunta
así en `earned.exp`.

## Menta (`src/game/team/mints.ts`)

```ts
const MintKind = { Random: 'random', Neutral: 'neutral' } as const
const MINT_PRICES: Record<MintKind, number> // Random: MINT_PRICE (20 000), Neutral: NEUTRAL_MINT_PRICE (10 000)
mintsOf(s, kind); buyMint(s, kind); mintBlocker(s, uid, kind); applyMint(s, uid, kind, rng)
```

- Neutra: pone `NEUTRAL_NATURE`. `mintBlocker` añade «Ya tiene una naturaleza neutra.» si ya la tiene.
- Aleatoria: igual que hoy.
- `bag.ts › Bag` añade `neutralMints` (`mintsOf(s, MintKind.Neutral)`).

## Rutas (`src/data/maps/mapCommon.ts`)

`pathStopCount(path: string[]): number` = `path.length − 1`.
