# Quickstart: validar Ajustes varios

## Requisitos

- Node `>=22.13`, `npm install` hecho.
- Para las historias 1 y 2: `npm run db:migrate:local` y `npm run preview` (Worker en http://localhost:8787, abierto a la red local).

## Puerta automática

```bash
npm run check   # typecheck + lint + tests (incluye los nuevos *.test.ts de game)
npm run smoke   # con npm run dev abierto: arranque y pestañas (toca guardado y actualización)
```

Tests que deben existir (nombres en español, sin fijar números: leen las constantes):

- `core/cloudChoice.test.ts`: sin progreso desde la instantánea, se baja; con progreso real en los dos lados, se
  pregunta; un Pokémon vendido en otro dispositivo no cuenta como progreso; enlace sin instantánea = regla de antes;
  `recommendedSave` elige la jugada después.
- `core/saveMigration.test.ts`: una partida de la versión 65 llega con `neutralMints` = 0 y conserva `mints`.
- `collection/pieces.test.ts`: el ₽ de los tickets sobrantes es `PIECES_PER_COMBINE × pieceSalePrice`.
- `trade/serverSale.test.ts` y `collection/shredder.test.ts`: con `Protect` no se vende ni tritura un favorito; con
  `Allow`, sí; el compañero sigue sin poder venderse con `Allow`.
- `tower/towerRewards.test.ts`: por debajo del primer corte la EXP no cambia; en cada tramo, × su multiplicador; si el
  Pokémon sube de tramo en la subida, cada piso usa el nivel con el que se ganó.
- `team/mints.test.ts`: comprar y usar la neutra; no se usa en un Pokémon ya neutro; la aleatoria sigue igual.

## Comprobación a mano (viewport móvil)

1. **Actualizar de una vez**: con `npm run preview`, abrir la app en el móvil y cerrarla. Hacer tres cambios visibles
   y, tras cada uno, `npm run build` (el Worker sirve lo nuevo). Abrir la app y pulsar «Actualizar» una vez: debe
   cargarse el último cambio y el aviso no debe volver. Repetir con la red del móvil limitada (instalación lenta).
2. **Dispositivo viejo**: con una cuenta, jugar en el navegador A y vender un Pokémon. En el navegador B (partida
   vieja de la misma cuenta, sin jugar), abrir: carga la de la nube sin preguntar y avisa. Repetir jugando algo en B sin
   conexión: sale «¿Con qué partida sigues?» con la de la nube marcada «Más reciente».
3. **Trituradora**: Gacha › Trituradora, tocar una especie con muchos tickets, escribir una cantidad y confirmar: el
   botón muestra los trozos y se trituran justo esos. Probar 0, más del máximo y texto.
4. **Tickets sobrantes**: en la ficha de un Pokémon a 5 ★, el ₽ por 5 tickets es 5 × el precio por ticket de Tienda › Venta.
5. **Favoritos**: con una especie favorita con tickets y un Pokémon repetido (no compañero), en Trituradora y Venta
   aparece la sección «Favoritos»; triturar y vender desde ahí con aviso de favorito; en Intercambios sigue bloqueado.
6. **Paradas**: tocar una ruta completada: «N paradas»; una sin completar: no sale.
7. **Torre**: subir con un Pokémon de nivel 49 y con uno de 50 el mismo piso: el segundo gana ×0,9.
8. **Menta neutra**: Tienda › Mentas, comprar la neutra (10 000 ₽), Mochila, usarla en la ficha de un Pokémon no neutro:
   pasa a Seria; en uno Seria no se puede.

## Después

- `docs/diseno.md` (tabla «Sistemas»), `CLAUDE.md` (tabla de ficheros: `cloudChoice.ts`, `CountDialog.tsx`), anuncio
  en `data/announcements.ts`, y `npm run shots` si cambian las capturas de Tienda › Mentas o la Trituradora.
