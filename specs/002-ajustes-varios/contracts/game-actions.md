# Contrato: acciones del juego que usa la UI

No cambia ninguna API del servidor ni el protocolo de la nube (`/api/save` igual). Lo que se expone desde `src/game`
a la UI (vía `act()`) es esto. Firmas orientativas; los nombres finales pueden ajustarse en la implementación.

| Acción / consulta | Dónde | Devuelve | Sin efecto si… |
|---|---|---|---|
| `shred(s, speciesId, count, policy = Protect)` | `collection/shredder.ts` | trozos ganados | favorito con `Protect`, `count < 1` |
| `shredSelection(s, selection)` | `collection/shredder.ts` | trozos ganados | (solo no favoritos, como hoy) |
| `favoriteStock(s)` | `collection/shredder.ts` | `{ speciesId, count }[]` de favoritos con tickets | — |
| `sellMon(s, uid, policy = Protect)` | `trade/serverSale.ts` | ₽ cobrados (0 si no) | compañero, fuera del rancho o la Caja, favorito con `Protect` |
| `sellPieces(s, speciesId, count, policy = Protect)` | `trade/serverSale.ts` | ₽ cobrados (0 si no) | favorito con `Protect`, sin tantos tickets |
| `favoriteMons(s)` | `trade/serverSale.ts` | Pokémon de especies favoritas que podrían venderse | — |
| `pieceSalePrice(id)`, `surplusMoney(id)` | `serverSale.ts`, `pieces.ts` | ₽; `surplusMoney = PIECES_PER_COMBINE × pieceSalePrice` | — |
| `pathStopCount(path)` | `data/maps/mapCommon.ts` | paradas del camino | — |
| `towerExpMult(level)` | `tower/towerRewards.ts` | multiplicador de EXP | — |
| `buyMint(s, kind)` | `team/mints.ts` | `boolean` | sin ₽ |
| `applyMint(s, uid, kind, rng)` | `team/mints.ts` | nueva naturaleza o `null` | sin menta de ese tipo, fuera del rancho o la Caja, neutra en un Pokémon ya Seria |
| `cloudAction(link, userId, cloud, local)` | `core/cloudSave.ts` | `Upload` / `Download` / `Ask` | — |
| `syncSnapshot(s)`, `progressSince(s, snap)`, `recommendedSave(cloudAt, localAt)` | `core/cloudChoice.ts` | instantánea / `boolean` / `SaveSide` | — |

## Componentes compartidos de UI

- `ui/shared/CountDialog.tsx`: `{ title, max, unitPrice?, confirmLabel(count), warning?, onConfirm(count), onClose }`.
  Lo usan la Venta (por cantidad) y la Trituradora (por especie). `warning` muestra el aviso de favorito.
- `ui/account/CloudChoiceDialog.tsx`: recibe además qué lado se recomienda y marca esa tarjeta con «Más reciente».
