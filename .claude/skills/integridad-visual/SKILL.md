---
name: integridad-visual
description: Mantener la coherencia artística y visual de Pokérancho en toda la app (colores, tipografía, botones, chips de tipo, paneles, diálogos, iconos, espaciados, capas y estilo de combate). Úsala al crear o cambiar cualquier pantalla, componente o CSS de src/ui, al revisar un cambio visual ("¿queda bien?", "no pega con el resto", "alinea los estilos") o para auditar la app en busca de estilos sueltos.
---

# Integridad artística visual

Pokérancho se ve como un juego de Pokémon de GBA en un móvil en vertical: superficies crema y blancas, texto casi
negro, rojo Pokédex de acento y el color de cada tipo en todo lo que tenga tipo. Todo lo nuevo tiene que parecer
hecho por la misma mano que lo que ya hay. **Antes de inventar un estilo, busca el que ya existe y reutilízalo.**

Complementa a `nueva-pantalla` (cómo se monta una pantalla) y a `fondos-pixel-art` (los fondos de ruta). Esta skill
decide **cómo se ve**.

## 1. Dos familias visuales (y no mezclarlas)

| Familia | Dónde | Cómo se ve | Piezas |
|---|---|---|---|
| **App** | Rancho, menús, tienda, Pokédex, fichas, diálogos | Crema (`--bg`, `--card`, `--card-2`), borde fino `--line`, radio `--radius`/12px, sombras suaves | `.btn` y variantes, `.card`, `.notice`, `.tag`, `Modal`, `Foldout`, `FoldSection`, `IconTabs` |
| **Combate** | Barra de ataques, marcadores de PS, escena de ruta, torre, raid e incursión | Menú de los juegos: borde grueso `--frame-ink` (2–3 px), degradado crema `#fdfcf4 → #ecead9`, sombra dura `0 2px 0 #0004`, elegido con marco `--yellow` y flecha | `MoveBarMoves` (`move-bar.css`), `BattleHud` (`battle-hud.css`), `IncursionStage` |

- Un **ataque** se muestra siempre con los botones de `MoveBarMoves` (también fuera del combate, como en la «i» de la
  ficha); en texto corrido, `MoveChip`. Nunca una tarjeta de ataque nueva.
- Los datos completos de un ataque: `ui/shared/sheet/MoveDetail.tsx`.
- Dentro de un `Modal` de la familia App se pueden usar piezas de Combate (los botones de ataque), pero no al revés.

## 2. Color

- **Solo variables de `styles/tokens.css`** para colores de la interfaz (`--text`, `--muted`, `--accent`, `--line`,
  `--card`, `--hp-*`, `--exp`, `--favorite`…). Un color nuevo que se repita ⇒ token nuevo con comentario.
- **Un solo amarillo**: `--yellow` (estrellas, avisos, marco de elegido y objetivo en combate); tonos claros con
  `color-mix(in srgb, var(--yellow) 35%, #fff)`, no otro hex.
- **Color de tipo**: siempre de `TYPE_INFO[type].color`, pasado como `--type-color` en `style` y usado en el CSS
  (`color-mix(in srgb, var(--type-color) 22%, #fff)` para fondos claros). Donde no hay `style` (p. ej. los estados
  sobre el sprite), las variables globales `--type-<tipo>` (`ui/shared/typeColors.ts › installTypeColors`, al arrancar
  la app y la vista previa del editor). Nunca el hex de un tipo escrito a mano.
- **Rareza**: `RARITY_INFO[r].color`. **Estado alterado**: el `type` de `STATUS_INFO`.
- Blanco y negros translúcidos (`#fff`, `#0004`, `#0006`) sí se escriben a mano: son luces y sombras, no colores.
- Borde oscuro de combate: `--frame-ink`.
- Texto sobre un color: blanco con `text-shadow: 0 1px 0 #0006` (como `.type-badge`, `.moves-info-class`).
- Sin modo oscuro: la paleta es fija (`color-scheme: light`).

## 3. Tipografía

- Una sola familia, la del sistema (`:root`). No añadir fuentes. Excepción ya existente: la «i» en Georgia cursiva.
- Tamaños de la escala: **10, 11, 12, 13, 14, 16, 18, 22, 24 px** (y los grandes de títulos de premio). Clases antes
  que números: `.tiny`, `.small`, `.label`, `.section-title`, `h3`, `h4`.
- Pesos: 700 (botones, texto destacado), 800 (etiquetas, chips), 900 (nombres en combate, títulos de botón de
  ataque). No usar 600 ni 400 salvo para quitar negrita.
- Etiquetas de sección pequeñas en mayúsculas: `.label`, o en combate 10px · 900 · `uppercase` · `#5a5446`.

## 4. Forma y espacio

- Radios: `--radius` (14px) para tarjetas y paneles, 12px botones `.btn`, 10px botones de combate, 6–8px chips y
  etiquetas, `50%` círculos, `99px` píldoras. Ni 9px, ni 999px, ni radios nuevos.
- Espacios en múltiplos de 2: 4, 6, 8, 10, 12, 16 px. Gutter de pantalla 16px.
- **Zona táctil ≥ 44 px** en todo lo que se toca (`.btn.small::after` y `.link-btn::after` ya la amplían).
- Rejillas de botones: 2 columnas (como el menú de combate) o la cuadrícula de `MonPicker`/`ShopTile`.

## 5. Piezas que ya existen (úsalas)

| Necesito… | Usa |
|---|---|
| Botón | `.btn` + `primary` (acción principal, roja), `go` (verde, entrar), `ghost`, `small`, `wide`, `danger`, `round-btn` (− / +); enlace: `.link-btn` |
| Ventana | `Modal` (fondo, tocar fuera, «Atrás»); confirmar: `ConfirmDialog`; premio: `RewardOverlay` / `RevealOverlay` |
| Panel que sube | `RanchSheet` / `MenuSheetHeader`; desplegable grande: `Foldout`; sección plegada: `FoldSection` |
| Pestañas | `IconTabs` (solo icono; la activa con su nombre); segmentos: `.segmented` |
| Tipo / rareza / estrellas | `TypeBadge`, `.tag` con `RARITY_INFO`, `.stars` |
| Pokémon | `Sprite` (con `shiny`, `fit`), `BoxIcon`, `MonPicker` para elegir uno |
| Barra | `Bar` (`hp`, `exp`) |
| Icono | `ItemIcon` con `ICON` de `ui/shared/icons.ts` (objetos de PokeAPI) |
| Dinero, cantidades, tiempos | `formatMoney`, `formatCount`, `ui/shared/format.ts` |
| Aviso | `.notice`; punto o contador: `.dot`, `.count-badge` + `useUnseen` |
| Ataques | `MoveBarMoves` (botones), `MoveChip` (en línea), `MoveDetail` (datos completos) |

## 6. Iconos y símbolos

- **Sin emojis.** Iconos de objetos de PokeAPI con `ItemIcon`; las medallas, en SVG (`BadgeIcon`).
- Símbolos tipográficos permitidos: `★` (estrellas), `−`/`+`, `·` como separador, `«»` en textos, `✕` solo para cerrar.
- Sprites: los de PokeAPI (`data/spriteHost.ts`) y el GIF animado de Blanco y Negro; no mezclar otros estilos.

## 7. Capas y movimiento

- `z-index` con las variables `--z-*` de `tokens.css` entre pantallas; números pequeños (1–9) solo dentro de un
  componente.
- Animaciones cortas (≤ 300 ms en interfaz) y que respeten `prefers-reduced-motion` (ya global en `tokens.css`).
- Al pulsar: `.btn` encoge (`scale(0.96)`); los de combate bajan 2px (`translate: 0 2px`). No inventar otro.

## 8. Textos

- Español, frases cortas, en el tono del juego («Toca otro para cambiarlo», «Está fuera: …»).
- Nombres de botón con verbo: «Entrar», «Cambiar ataques», «Fijar». «Atrás» para volver, «Entendido» para cerrar
  una explicación.

## Checklist de un cambio visual

- [ ] ¿Reutiliza una pieza de la tabla 5 en lugar de crear una parecida?
- [ ] ¿Es de la familia correcta (App o Combate) y no mezcla las dos?
- [ ] ¿Todos los colores salen de tokens, `TYPE_INFO`, `RARITY_INFO` o `STATUS_INFO`?
- [ ] ¿Tamaños de letra, pesos, radios y espacios de la escala?
- [ ] ¿Zona táctil ≥ 44 px y sin scroll horizontal a 390 px de ancho?
- [ ] ¿Sin emojis; iconos con `ItemIcon`?
- [ ] ¿`z-index` con `--z-*`?
- [ ] ¿Estados vacío, desactivado (`:disabled`, opacidad 0.45) y elegido visibles y como en el resto?
- [ ] ¿Comprobado en `npm run dev` a 390×844 junto a una pantalla parecida ya existente?

## Auditoría (buscar estilos sueltos)

Desde `src/`, con Bash:

```bash
# Colores escritos a mano (los translúcidos de luz y sombra son normales)
grep -rhoE "#[0-9a-fA-F]{3,8}\b" ui --include=*.css | sort | uniq -c | sort -rn
# Tamaños de letra, radios y pesos fuera de la escala
grep -rhoE "font-size: *[0-9.]+px" ui styles --include=*.css | sort | uniq -c | sort -rn
grep -rhoE "border-radius: *[^;]+" ui styles --include=*.css | sort | uniq -c | sort -rn
grep -rhoE "font-weight: *[0-9]+" ui styles --include=*.css | sort | uniq -c | sort -rn
# z-index sin variable
grep -rnE "z-index: *[0-9]{2,}" ui styles --include=*.css
# Botones que no usan .btn (cada uno debería tener un motivo)
grep -rhoE "<button className=\"[a-z-]+" ui --include=*.tsx | sort | uniq -c | sort -rn
# Fuentes
grep -rn "font-family" ui styles --include=*.css
```

Presenta lo encontrado como lista priorizada (qué rompe más la coherencia primero) y **no lo arregles sin que el
usuario lo apruebe**.
