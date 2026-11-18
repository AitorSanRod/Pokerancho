# Feature Specification: Ajustes varios (actualización, nube, venta, trituradora, rutas, torre y Menta neutra)

**Feature Branch**: `002-ajustes-varios`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "1. Actualizaciones después de varias subidas aparece dos veces y solo se actualiza a la segunda. 2. El archivo de guardado tras actualizar toma como referencia el guardado de ese dispositivo, no tiene sentido ya que lleva sin usarse mucho tiempo y se acaba de actualizar. 3. En el gacha la trituradora debe funcionar de la misma manera que la venta de la tienda (Poniendo números). 4. La venta de los tickets después de tener 5 estrellas y el pokemon al 100 no tiene el mismo precio de venta que en la tienda. Debe ser consistente. 5. Crear secciones de favoritos en trituradora y venta que solo muestre aquellos pokemon en favoritos y si deje romper tickets y vender pokemon. 6. Si ya has completado una ruta, al seleccionarla deben poder verse los nodos que tiene dentro (Solo el numero). 7. Torre infinita, a partir del nivel 50, la experiencia debe estar multiplicada por 0.9, a partir del 75 por 0.8 y a partir del 90 por 0.75. 8. Añadir una menta que ponga la naturaleza neutra."

## Clarifications

### Session 2026-11-17

- Q: Si la partida de la nube se jugó después pero el dispositivo tiene algo que la nube no, ¿qué pasa? → A: Se sigue preguntando, recomendando la más reciente.
- Q: ¿A qué se refieren los tramos 50 / 75 / 90 de la EXP de la torre? → A: Al nivel del Pokémon que sube.
- Q: ¿A qué precio se vende la Menta neutra? → A: 10 000 ₽.
- Q: ¿Qué precio común tienen los tickets sobrantes y la Venta? → A: El de la Venta (50 / 100 / 150 / 250 ₽ por ticket, sin `MONEY_GAIN_MULT`), aunque los sobrantes comunes den unas 10 veces más que antes.

## User Scenarios & Testing *(mandatory)*

Ocho cambios independientes: cada historia se puede hacer, probar y publicar sola.

### User Story 1 - Actualizar la app de una sola vez (Priority: P1)

Un jugador abre la app después de que se hayan publicado varias versiones seguidas. Le sale el aviso «¡Pokérancho se ha
actualizado!», pulsa «Actualizar» y la app queda en la última versión. Hoy el aviso vuelve a salir justo después y solo
a la segunda queda al día.

**Why this priority**: es un fallo que ven todos los jugadores con cada tanda de publicaciones y da sensación de app rota.

**Independent Test**: publicar tres versiones seguidas sin abrir la app en un móvil; al abrirla, pulsar «Actualizar» una
vez y comprobar que la versión cargada es la última y que el aviso no vuelve.

**Acceptance Scenarios**:

1. **Given** hay varias versiones publicadas desde la última vez que se abrió la app, **When** el jugador pulsa «Actualizar», **Then** la app se recarga con la versión más reciente y el aviso no vuelve a aparecer.
2. **Given** se publica otra versión mientras el jugador ya está recargando, **When** termina la recarga, **Then** como mucho se avisa una vez más de esa versión nueva (no de una que ya se instaló).
3. **Given** el jugador pulsa «Más tarde», **When** vuelve a la app, **Then** se le avisa de nuevo una sola vez.

---

### User Story 2 - La partida más reciente manda al volver a un dispositivo viejo (Priority: P1)

Un jugador con cuenta ha jugado durante semanas en un móvil y abre la app en otro dispositivo que llevaba mucho sin usar.
La app se actualiza y, tras actualizar, el jugador debe seguir con su partida más reciente (la de la nube), no con la
vieja que quedó en ese dispositivo.

**Why this priority**: puede hacer creer al jugador que ha perdido progreso o, peor, que la partida vieja pise a la buena.

**Independent Test**: con una cuenta, jugar en el dispositivo A y subir; abrir el dispositivo B (con una partida
anterior de la misma cuenta) tras publicar una versión nueva, actualizar y comprobar qué partida queda.

**Acceptance Scenarios**:

1. **Given** la partida de la nube se jugó después que la del dispositivo y el dispositivo no tiene progreso que la nube no tenga, **When** se abre y actualiza la app, **Then** se carga la de la nube sin preguntar y se avisa de que es la más reciente.
2. **Given** la partida de la nube se jugó después que la del dispositivo pero el dispositivo tiene algo que la nube no (p. ej. un Pokémon recreado o jugado sin conexión), **When** se abre la app, **Then** se pregunta con «¿Con qué partida sigues?», que marca la de la nube como la más reciente y recomendada.
3. **Given** cualquier caso, **When** el dispositivo viejo conecta con la cuenta, **Then** nunca sube su partida encima de una de la nube jugada después sin que el jugador lo haya elegido.

---

### User Story 3 - Triturar escribiendo la cantidad (Priority: P2)

En Gacha › Trituradora el jugador elige un Pokémon y escribe cuántos tickets triturar (con el total de trozos que dará),
igual que en Tienda › Venta, en lugar de marcarlos uno a uno.

**Why this priority**: con cientos de tickets, marcarlos de uno en uno es lento; la venta ya resolvió este problema.

**Independent Test**: con 120 tickets de una especie, triturar 100 escribiendo «100» y confirmar; quedan 20 y se suman los trozos que indica la confirmación.

**Acceptance Scenarios**:

1. **Given** el jugador tiene N tickets de una especie, **When** toca su casilla en la Trituradora, **Then** se abre un diálogo con un campo de cantidad (de 1 a N) y el botón de confirmar muestra los trozos que dará.
2. **Given** escribe una cantidad mayor que N o no válida, **When** intenta confirmar, **Then** se corrige o se bloquea igual que en la venta.
3. **Given** confirma, **Then** se trituran exactamente esos tickets y se muestra cuántos trozos ha ganado.
4. **Given** quiere triturar todos los tickets de una rareza, **Then** sigue pudiendo hacerlo con una sola acción y confirmación.

---

### User Story 4 - Tickets sobrantes al mismo precio que en la Venta (Priority: P2)

Cuando un Pokémon ya tiene las 5 ★, combinar sus tickets en la ficha da pokécuartos. Ese dinero debe ser el mismo que
daría vender esos tickets en Tienda › Venta.

**Why this priority**: hoy son precios muy distintos (5 tickets comunes dan 23 ₽ en la ficha y 250 ₽ en la Venta) y el jugador no sabe cuál usar.

**Independent Test**: con un Pokémon a 5 ★, comparar el ₽ que anuncia y da la ficha por sus tickets con el que da la Venta por la misma cantidad.

**Acceptance Scenarios**:

1. **Given** un Pokémon con las ★ al máximo y tickets de su especie, **When** el jugador los cambia por ₽ desde la ficha, **Then** recibe por cada ticket lo mismo que en Tienda › Venta.
2. **Given** la ficha muestra el ₽ que dará, **Then** el número coincide con el que daría la Venta.

---

### User Story 5 - Sección de favoritos en Trituradora y Venta (Priority: P2)

Los favoritos (corazón) están protegidos: no aparecen para triturar ni se pueden vender. El jugador quiere, en la
Trituradora y en la Venta, una sección aparte «Favoritos» que muestre solo sus favoritos y desde la que sí pueda
triturar sus tickets y vender sus Pokémon (y sus tickets).

**Why this priority**: hoy hay que quitar el corazón, vender y volver a ponerlo; es tedioso con Pokémon que tienen muchos tickets.

**Independent Test**: marcar una especie como favorita con tickets y un Pokémon repetido; en la sección Favoritos de la Trituradora triturar parte de sus tickets y en la de la Venta vender el Pokémon, sin quitar el corazón.

**Acceptance Scenarios**:

1. **Given** el jugador tiene favoritos con tickets, **When** abre la Trituradora, **Then** ve una sección «Favoritos» con solo esas especies, separada del resto, y puede triturar sus tickets con el mismo diálogo de cantidad.
2. **Given** abre la Venta, **Then** ve una sección «Favoritos» con sus Pokémon y tickets favoritos, y puede venderlos.
3. **Given** vende o tritura algo de un favorito, **Then** la confirmación avisa de que es un favorito antes de hacerlo.
4. **Given** no tiene favoritos con nada que triturar o vender, **Then** la sección no aparece o indica que está vacía.
5. **Given** un favorito, **When** se intenta dar en un intercambio, **Then** sigue protegido como hoy.

---

### User Story 6 - Ver cuántas paradas tiene una ruta completada (Priority: P3)

Al tocar una ruta que ya se ha completado, en la ventana de comenzar se ve cuántas paradas tiene (solo el número, sin
decir de qué tipo son).

**Why this priority**: ayuda a planear (duración, curas) sin desvelar el contenido de rutas no jugadas.

**Independent Test**: tocar una ruta completada y una sin completar; solo la primera muestra «N paradas».

**Acceptance Scenarios**:

1. **Given** una ruta completada, **When** el jugador la selecciona, **Then** la ventana de comenzar muestra el número de paradas del camino que va a recorrer.
2. **Given** una ruta no completada, **When** la selecciona, **Then** no se muestra el número.

---

### User Story 7 - Menos EXP en los pisos altos de la torre (Priority: P3)

En la torre infinita, la EXP que gana el Pokémon que sube se reduce según su nivel: ×0,9 desde el nivel 50, ×0,8 desde
el 75 y ×0,75 desde el 90.

**Why this priority**: ajuste de balance; la torre da demasiada EXP en lo alto frente a las rutas.

**Independent Test**: subir la torre con Pokémon de nivel 40, 60, 80 y 95 y comparar la EXP de un mismo piso con la que daba antes del cambio.

**Acceptance Scenarios**:

1. **Given** el Pokémon que sube es de nivel menor que 50, **Then** la EXP de cada piso no cambia.
2. **Given** es de nivel entre 50 y 74, **Then** la EXP es la de antes ×0,9; entre 75 y 89, ×0,8; desde 90, ×0,75.
3. **Given** cualquier piso, **Then** el ₽, los premios de piso, los tickets y los Huevos Suerte no cambian.

---

### User Story 8 - Menta neutra (Priority: P3)

En la Tienda se puede comprar una Menta neutra que, usada en la ficha de un Pokémon, le pone la naturaleza neutra
(Seria: no sube ni baja ninguna stat). Va a la Mochila como la Menta aleatoria.

**Why this priority**: permite deshacer una naturaleza que perjudica sin depender del azar.

**Independent Test**: comprar una Menta neutra, usarla en un Pokémon con naturaleza Osada y comprobar que pasa a Seria y que la Menta se gasta.

**Acceptance Scenarios**:

1. **Given** el jugador tiene ₽ suficientes, **When** compra una Menta neutra, **Then** se descuenta su precio y aparece en la Mochila.
2. **Given** tiene una Menta neutra y un Pokémon en el rancho o la Caja con naturaleza no neutra, **When** la usa en su ficha, **Then** el Pokémon pasa a Seria y la Menta se gasta.
3. **Given** el Pokémon ya es Seria, **Then** no se puede usar (no se gasta) y se explica por qué.
4. **Given** el Pokémon no está en el rancho ni en la Caja (expedición, ruta…), **Then** no se puede usar, igual que la Menta aleatoria.

### Edge Cases

- Actualización: el jugador cierra la app mientras se descarga la versión nueva; al volver se avisa una sola vez de la última.
- Actualización: sin conexión al pulsar «Actualizar», se recarga con la versión ya descargada.
- Nube: las dos partidas con la misma hora de juego (o el reloj del dispositivo adelantado); ver Assumptions.
- Nube: la partida de la nube es de una versión más nueva de la app; se mantiene el aviso de actualizar sin tocar nada.
- Trituradora: escribir 0, negativos, decimales o texto en la cantidad; se trata igual que en la Venta.
- Tickets sobrantes: un número de tickets que no es múltiplo de 5 (el cambio por ₽ se hace de 5 en 5, como hoy).
- Favoritos: un Pokémon favorito que es el compañero, está en expedición, en ruta, en una raid o reservado para una incursión: sigue sin poder venderse, como cualquier otro en esa situación.
- Favoritos: vender el último Pokémon de una especie favorita; la especie sigue marcada como favorita.
- Ruta completada con varios caminos: se muestra el número de paradas del camino que se recorrerá.
- Torre: si el Pokémon sube de nivel durante la subida y cruza un umbral (p. ej. del 49 al 50), cada piso usa el multiplicador del nivel que tenía al ganarlo.
- Menta neutra: el jugador usa la Menta aleatoria en un Pokémon Seria (sigue funcionando como hoy).

## Requirements *(mandatory)*

### Functional Requirements

**Actualización (historia 1)**

- **FR-001**: Al pulsar «Actualizar», la app MUST quedar en la versión más reciente publicada con una sola recarga, aunque haya varias versiones nuevas pendientes.
- **FR-002**: Tras actualizar, el aviso MUST NOT volver a salir por una versión que ya está en uso.

**Partida en la nube (historia 2)**

- **FR-003**: Al conectar con la cuenta (al abrir la app, al volver a ella o tras actualizar), si otro dispositivo ha subido después de la última sincronización de este, la app MUST mirar si en este dispositivo se ha hecho progreso desde esa última sincronización (Pokémon nuevos o con más nivel o ★, rutas completadas nuevas). Lo que falta aquí porque se vendió, intercambió o recreó en otro dispositivo no cuenta como progreso.
- **FR-004**: Si no hay progreso aquí desde la última sincronización (o el que hay ya está en la nube), MUST cargarse la de la nube sin preguntar y avisar de que es la más reciente.
- **FR-005**: Si hay progreso aquí desde la última sincronización que la nube no tiene, la app MUST seguir preguntando con la ventana «¿Con qué partida sigues?», que MUST marcar como «Más reciente» y recomendada la que se jugó después (en cualquier sentido: también si es la del dispositivo).
- **FR-006**: El dispositivo MUST NOT subir su partida encima de una de la nube jugada después, salvo que el jugador lo elija (hoy ya lo impide el servidor con la revisión: se mantiene y se cubre con un test).

**Trituradora (historia 3)**

- **FR-007**: En la Trituradora, tocar una especie MUST abrir un diálogo para escribir cuántos tickets triturar (1 al máximo que tiene), con la misma validación y corrección que la Venta, y el total de trozos MUST verse en el botón de confirmar.
- **FR-008**: Se MUST poder seguir triturando todos los tickets de una rareza con una acción y una confirmación.

**Tickets sobrantes (historia 4)**

- **FR-009**: El ₽ que da cambiar los tickets de un Pokémon con las ★ al máximo MUST ser, por ticket, el mismo que paga Tienda › Venta por un ticket de esa especie; la ficha MUST mostrar ese mismo importe.

**Favoritos (historia 5)**

- **FR-010**: La Trituradora y la Venta MUST tener una sección «Favoritos» aparte, con solo las especies favoritas (y en la Venta, también sus Pokémon), desde la que se pueden triturar sus tickets, vender sus tickets y vender sus Pokémon; la confirmación MUST avisar de que es un favorito.
- **FR-011**: Los favoritos MUST seguir protegidos en los intercambios y en cualquier otro sitio que no sea esa sección (en las listas normales de la Trituradora siguen ocultos y en las de la Venta, desactivados, como hoy).

**Rutas (historia 6)**

- **FR-012**: En la ventana de comenzar una ruta completada MUST verse el número de paradas del camino que se va a recorrer; en las no completadas, no.

**Torre (historia 7)**

- **FR-013**: La EXP que gana en la torre el Pokémon que sube MUST multiplicarse por 0,9 si su nivel al ganar el piso es 50 o más, por 0,8 si es 75 o más y por 0,75 si es 90 o más. Nada más de lo que da la torre cambia (₽, premios de piso, tickets, Huevos Suerte).

**Menta neutra (historia 8)**

- **FR-014**: La Tienda MUST vender una Menta neutra por 10 000 ₽, sin límite de compra; se guarda en la Mochila separada de la aleatoria.
- **FR-015**: Usar la Menta neutra en la ficha MUST poner la naturaleza Seria y gastarla; con las mismas condiciones de uso que la Menta aleatoria, y además no se puede usar en un Pokémon que ya es Seria.
- **FR-016**: Las partidas guardadas MUST conservar todo al actualizar (las Mentas aleatorias que tuvieran siguen intactas; las neutras empiezan en 0).

### Key Entities *(include if feature involves data)*

- **Menta neutra**: objeto de la Mochila que se compra en la Tienda; cantidad que tiene el jugador, aparte de la Menta aleatoria.
- **Multiplicador de EXP de la torre**: tabla de umbrales del nivel del Pokémon que sube (50, 75, 90) con su factor (0,9 / 0,8 / 0,75).
- **Favorito**: especie marcada con el corazón (ya existe); se añade dónde se puede vender o triturar a pesar de serlo.

## Choques con el diseño actual

| # | Comportamiento de hoy (referencia) | Propuesta | Alternativa que lo preserva |
|---|---|---|---|
| 1 | `reloadApp` ya intenta esperar a la versión más nueva antes de activar la que espera (`src/net/appUpdate.ts`), pero en la práctica se actualiza dos veces. | Corregir el fallo; no cambia ninguna regla. | — (es un fallo) |
| 2 | Nunca se baja la partida de la nube sin preguntar si aquí hay progreso que la nube no tiene (`src/game/core/cloudSave.ts › cloudAction`, `hasUnsavedProgress`; Principio IV). | Se mantiene la pregunta; solo se carga sola la de la nube cuando además es la más reciente y aquí no hay nada nuevo (como hoy), y la ventana recomienda la más reciente. El dispositivo viejo nunca sube encima de una más reciente sin elegirlo. | Elegida por el usuario (2026-11-17): se preserva la regla de no perder nada sin preguntar. |
| 3 | La Trituradora se marca ticket a ticket por casilla y por rareza (`src/ui/gacha/Shredder.tsx`). | Diálogo de cantidad como la Venta (`src/ui/sell/SellCountDialog.tsx`). | — (sustituye la forma de marcar) |
| 4 | Con ★ al máximo, 5 tickets dan `RARITY_INFO.surplusMoney` × `MONEY_GAIN_MULT` (`src/game/collection/pieces.ts › surplusMoney`, `src/data/species.ts`): 23 / 58 / 173 / 575 ₽; la Venta paga `PIECE_SALE_PRICE` por ticket (`src/game/trade/serverSale.ts`): 50 / 100 / 150 / 250 ₽. | El cambio de la ficha paga 5 × el precio por ticket de la Venta, sin `MONEY_GAIN_MULT` (como la Venta). Ese precio pasa a `RARITY_INFO.ticketSalePrice`, que sustituye a `PIECE_SALE_PRICE` y a `RARITY_INFO.surplusMoney`. | Ajustar los precios de la Venta a los de la ficha. |
| 5 | Los favoritos no se trituran ni se venden ni se intercambian (`shredder.ts › shreddableStock`, `tradeGive.ts`, `ui/sell/SellScreen.tsx`). | Sección «Favoritos» en Trituradora y Venta donde sí se puede; intercambios siguen protegidos. | — |
| 6 | La ventana de comenzar no dice cuántas paradas tiene la ruta; el mapa en curso muestra «?» en las paradas que faltan (`ui/route/RouteStartDialog.tsx`, `StopTrack`). | Mostrar el número solo en rutas completadas. | — |
| 7 | EXP de la torre = `expForLevel(towerLevel(piso), TOWER_EXP_PER_LEVEL)` × crecimiento pasado el piso 100 (`src/game/tower/towerRewards.ts › floorExp`), sin reducción por tramos. | Multiplicador por tramos del nivel del Pokémon que sube: 0,9 / 0,8 / 0,75. | — (ajuste de balance pedido) |
| 8 | Solo existe la Menta aleatoria, que nunca repite la naturaleza que tenía (`src/game/team/mints.ts`). | Añadir la Menta neutra junto a ella. | — (es nueva, no reemplaza) |

**Impacto**: el 2 cambia una regla de la nube (no cambia el servidor); el 8 cambia `GameState` (sube `SAVE_VERSION` con
el campo nuevo a 0); el 3 y el 5 cambian pantallas que salen en los Tutoriales (rehacer capturas si aparecen); el 4 y el 7
cambian números de `docs/diseno.md`. Merece un anuncio en el Tablón (Menta neutra, favoritos y Trituradora).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tras publicar 3 versiones seguidas, una sola pulsación de «Actualizar» deja la app en la última en el 100 % de las pruebas, y el aviso sale una sola vez.
- **SC-002**: Al abrir un dispositivo sin usar con una partida de la nube jugada después, el jugador sigue con la de la nube sin pasos extra en el 100 % de los casos de FR-004, y en los de FR-005 la ventana recomienda la de la nube.
- **SC-003**: Triturar 100 tickets de una especie lleva como mucho 3 toques (casilla, cantidad, confirmar).
- **SC-004**: Para cualquier especie con ★ al máximo, el ₽ por ticket de la ficha y el de la Venta son idénticos.
- **SC-005**: Vender un Pokémon o triturar tickets de un favorito no requiere quitar ni volver a poner el corazón.
- **SC-006**: El número de paradas sale en el 100 % de las rutas completadas y en ninguna sin completar.
- **SC-007**: La EXP de los pisos de cada tramo es exactamente la de antes por su multiplicador (redondeada a entero).
- **SC-008**: Ninguna partida pierde Mentas, Pokémon ni dinero al actualizar a esta versión.

## Assumptions

- «Pokémon al 100» en el punto 4 no añade condición: el cambio de tickets por ₽ ya depende solo de tener las 5 ★.
- El cambio de la ficha sigue haciéndose de 5 en 5 tickets; solo cambia el ₽ que da.
- La Menta neutra pone siempre la naturaleza Seria (es la única neutra del juego).
- «La hora de juego» de cada partida es la última vez que se jugó (la que ya enseña la ventana de elegir partida); con la misma hora, se mantiene lo de hoy.
- En la sección Favoritos de la Venta se pueden vender tanto los Pokémon como los tickets de las especies favoritas.
- El multiplicador de la torre solo afecta a la EXP; los tramos se definen con constantes con nombre para poder ajustarlos a mano.
- El número de paradas cuenta todas las paradas del camino principal, incluido el jefe final.
