# Feature Specification: Incursiones programadas

**Feature Branch**: `001-incursiones-programadas`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Vamos a hacer un rework de las incursiones. Estos son los puntos que he visto de mejora:
1. Planificación de incursiones. Manda una notificación a todos los móviles que los tengan habilitado.
2. Fianza: si se acepta una incursión, hay que depositar como fianza el 10% del dinero del jugador (se devolverá al hacer el checkin).
3. Para entrar, aparte de haber aceptado la invitación, hay que tener la llave en el inventario.
4. Checkin: se abrirá la sala 10 min antes del comienzo de la incursión. Durante el checkin se podrá modificar el Pokémon.
5. Habrá un botón de fijar que no permita hacer más modificaciones. Si no se fija, se entra con el Pokémon marcado. Siempre se marcará el primer Pokémon disponible en la lista del jugador.
6. En el anuncio de la incursión se mostrarán los premios de la incursión.
7. La persona que crea la incursión ocupa un hueco de la incursión directamente (incluyendo la fianza correspondiente)."

## Clarifications

### Session 2026-11-17

- Q: ¿Cómo se elige la hora de comienzo al programar una incursión: cualquier minuto o en franjas fijas? → A: Franjas de 15 min (:00, :15, :30, :45).
- Q: ¿Cuántas incursiones programadas puede tener pendientes cada jugador? → A: Hasta 3 creadas y 5 apuntadas (sin contar las creadas).
- Q: Si los cinco han hecho el checkin y fijado antes de la hora, ¿empieza ya o espera? → A: Siempre empieza a su hora.
- Q: Para aceptar, ¿hay que tener ya algún Pokémon dentro del nivel de entrada? → A: Sí, se exige al aceptar (y al crear).
- Q: ¿Quién debe recibir el aviso cuando alguien programa una incursión? → A: Todos los que tienen activados los avisos de incursiones, puedan entrar o no.
- Q: ¿Cómo se organiza la pestaña de Incursiones: una pantalla con secciones o subpestañas? → A: Subpestañas: Tablón / Mis incursiones / Programar.
- Q: ¿Se reservan el Pokémon marcado y una llave desde que se marca en la sala hasta el comienzo? → A: Sí (marcar exige la llave; el checkin no).
- Q: Si hay checkins pero nadie con Pokémon marcado y se cancela, ¿se reparten las fianzas de los ausentes? → A: Sí, igual que si empieza.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Programar una incursión y apuntarse (Priority: P1)

Un jugador elige una incursión y una hora de comienzo y la publica. Al publicarla ocupa ya uno de los 5 huecos y
deposita su fianza (el 10% de su dinero). La incursión aparece en un tablón de incursiones programadas con su nombre,
hora, huecos libres, nivel de entrada y los premios que da. Otros jugadores la ven en el tablón y la aceptan: cada uno
deposita su fianza y ocupa un hueco hasta llenar los 5.

**Why this priority**: sin programar y apuntarse no existe el nuevo modo; es la base sobre la que va todo lo demás y
ya resuelve el problema de fondo (quedar a una hora para jugar juntos en vez de coincidir por casualidad en la cola).

**Independent Test**: un jugador programa una incursión para dentro de 30 min y otro la acepta desde su móvil; ambos
ven 2/5 huecos ocupados, su dinero ha bajado un 10% y la fianza figura como depositada.

**Acceptance Scenarios**:

1. **Given** un jugador con 50.000 ₽ y conexión al servidor, **When** programa la Cueva Helada para dentro de 1 h,
   **Then** la incursión aparece en el tablón con 1/5 huecos ocupados (el suyo) y su dinero pasa a 45.000 ₽ con
   5.000 ₽ de fianza depositada.
2. **Given** una incursión programada con 3/5 huecos, **When** otro jugador con 20.000 ₽ la acepta, **Then** queda en
   4/5, ese jugador deposita 2.000 ₽ y la incursión figura en su lista de «Mis incursiones».
3. **Given** una incursión con 5/5 huecos, **When** otro jugador la mira en el tablón, **Then** la ve llena y no puede
   aceptarla.
4. **Given** un jugador que ya ha aceptado una incursión, **When** intenta aceptarla otra vez, **Then** no ocupa un
   segundo hueco ni paga otra fianza.
5. **Given** un jugador sin ningún Pokémon dentro del nivel de entrada, **When** abre la incursión en el tablón,
   **Then** no puede aceptarla y ve el motivo.

---

### User Story 2 - Checkin en la sala y entrada con un Pokémon (Priority: P1)

10 minutos antes de la hora de comienzo se abre la sala. Cada apuntado que entra hace el checkin: recupera su fianza y
ve marcado su primer Pokémon disponible (según el orden de su lista). Hasta que empiece puede cambiar de Pokémon y de
ataque o pulsar «Fijar», que bloquea su elección. A la hora de comienzo la incursión arranca con lo que cada uno tenga
marcado (fijado o no) y se gasta la llave de cada jugador que entra.

**Why this priority**: es el momento en que la programación se convierte en partida; sin checkin no hay incursión.

**Independent Test**: con una incursión programada, a falta de 10 min se abre la sala, el jugador entra, recupera la
fianza, cambia de Pokémon, fija y, a la hora, empieza la incursión con ese Pokémon.

**Acceptance Scenarios**:

1. **Given** una incursión aceptada que empieza en 15 min, **When** el jugador intenta entrar a la sala, **Then** ve
   que la sala abre en 5 min y no puede hacer el checkin todavía.
2. **Given** la sala abierta y el jugador con la llave en la Mochila, **When** hace el checkin, **Then** recupera
   íntegra su fianza y ve marcado el primer Pokémon disponible de su lista que cumpla el nivel de entrada.
3. **Given** el jugador en la sala sin fijar, **When** elige otro Pokémon u otro ataque, **Then** queda marcado el
   nuevo y lo ven los demás de la sala.
4. **Given** el jugador ha pulsado «Fijar», **When** intenta cambiar de Pokémon o de ataque, **Then** no puede.
5. **Given** el jugador hizo el checkin y no fijó, **When** llega la hora de comienzo, **Then** entra con el Pokémon y
   el ataque que tenga marcados.
6. **Given** la hora de comienzo, **When** arranca la incursión, **Then** se gasta una llave a cada jugador que entra
   y los huecos de quien no hizo el checkin se completan con bots.

---

### User Story 3 - Aviso de incursión programada (Priority: P2)

Cuando alguien programa una incursión, todos los jugadores que tengan activadas las notificaciones de incursiones
reciben un aviso en el móvil con la incursión y su hora. Además, quien la ha aceptado recibe un aviso cuando se abre
la sala del checkin.

**Why this priority**: sin el aviso el tablón solo funciona si se mira por casualidad; es lo que llena los huecos.

**Independent Test**: con dos móviles con notificaciones activadas, uno programa una incursión y el otro recibe el
aviso; si la acepta, recibe otro al abrirse la sala.

**Acceptance Scenarios**:

1. **Given** un jugador con las notificaciones de incursiones activadas, **When** otro programa una incursión,
   **Then** recibe un aviso con el nombre de la incursión y la hora de comienzo.
2. **Given** un jugador con esas notificaciones desactivadas, **When** se programa una incursión, **Then** no recibe
   nada.
3. **Given** quien la programa, **When** la publica, **Then** no recibe el aviso de su propia incursión.
4. **Given** un jugador apuntado a una incursión, **When** se abre la sala (10 min antes), **Then** recibe un aviso de
   que ya puede hacer el checkin.

---

### User Story 4 - Ver los premios en el anuncio (Priority: P2)

En el tablón y en el aviso de cada incursión programada se ven los premios que da esa incursión (₽, EXP, tickets y
los tickets de Pokémon concretos), los mismos que hoy muestra su información.

**Why this priority**: ayuda a decidir si apuntarse, pero el modo funciona sin ello.

**Independent Test**: abrir una incursión del tablón y comprobar que lista los mismos premios que su ficha de
información.

**Acceptance Scenarios**:

1. **Given** una incursión programada, **When** el jugador la abre en el tablón, **Then** ve sus premios por sala y
   su premio final.

---

### Edge Cases

- **Sin dinero**: un jugador con 0 ₽ puede aceptar; su fianza es 0 ₽. La fianza se redondea hacia abajo a ₽ enteros.
- **Sin llave al hacer el checkin**: puede hacer el checkin (recupera la fianza) y ver la sala, pero no puede marcar
  Pokémon y se le avisa de que sin llave no entrará; si consigue la llave antes de la hora, ya puede marcarlo. Si a la
  hora no tiene Pokémon marcado, no entra (su hueco lo ocupa un bot).
- **La llave tras el checkin**: desde que marca Pokémon, una llave de esa incursión queda **reservada** hasta el
  comienzo (no se puede ofrecer en intercambios); se gasta al entrar.
- **Deja de tener un Pokémon apto** después de aceptar (sube de nivel, lo vende o lo intercambia): sigue apuntado;
  se aplica lo de «ningún Pokémon disponible».
- **Ningún Pokémon disponible** al hacer el checkin (todos fuera del nivel, de expedición, en otra incursión o en la
  torre): no se marca ninguno y se le avisa; si alguno vuelve antes de la hora, puede marcarlo. Si a la hora no tiene
  ninguno marcado, no entra.
- **El Pokémon marcado** queda **reservado** hasta el comienzo: no puede salir de expedición, a la torre ni a otra
  actividad, así que no deja de estar disponible.
- **Nadie hace el checkin**: la incursión se cancela a la hora de comienzo sin gastar llaves.
- **Hay checkins pero nadie con Pokémon marcado**: la incursión se cancela sin gastar llaves y las fianzas de los
  ausentes se reparten igual entre quienes hicieron el checkin (FR-012).
- **El creador cancela la incursión**: ver FR-004.
- **Se da de baja** de una incursión aceptada: hasta 1 h antes de que abra la sala (1 h 10 min antes del comienzo)
  recupera la fianza entera y libera su hueco. Después ya no puede darse de baja: si no se presenta, cuenta como
  quien no hace el checkin.
- **No hace el checkin** dentro de los 10 min: pierde la fianza, que se reparte a partes iguales entre quienes sí
  hicieron el checkin (redondeado hacia abajo; el resto se pierde). Si nadie hizo el checkin, todas las fianzas se
  pierden.
- **Hizo el checkin pero no entra** (sin llave o sin Pokémon a la hora): ya recuperó su fianza y también recibe su
  parte del reparto, porque se presentó.
- **Creador que se da de baja**: no se da de baja, cancela la incursión (FR-004).
- **Dos incursiones a la vez**: un jugador no puede crear ni aceptar dos incursiones cuyas horas de comienzo estén a
  menos de 45 min (`SCHEDULE_GAP_MS`: la duración máxima de una incursión más la sala y un margen).
- **La app cerrada a la hora de comienzo**: si hizo el checkin, entra con lo marcado y la incursión sigue sola como hoy
  (al volver la ve donde va).
- **Sin servidor**: no hay tablón ni programación; se sigue jugando la incursión en local con bots al momento.
- **Móviles sin actualizar**: la cola automática ya no existe; al buscar grupo reciben un error y la app les avisa de
  que hay una versión nueva (aviso de actualización de siempre).
- **En plena cola al actualizar**: la cola en curso se cancela sin gastar la llave (como cancelarla hoy).

## Requirements *(mandatory)*

### Functional Requirements

**Programar**

- **FR-001**: Un jugador conectado al servidor MUST poder programar una incursión eligiendo cuál (de las que no son
  gratuitas) y la hora de comienzo.
- **FR-002**: La hora de comienzo MUST ser una franja de 15 min (en punto, y cuarto, y media o menos cuarto), al
  menos 15 min en el futuro y como mucho 7 días después. El selector solo ofrece franjas válidas.
- **FR-002b**: Un jugador MUST poder tener como mucho 3 incursiones programadas creadas y 5 aceptadas (sin contar las
  creadas) pendientes a la vez; al llegar al tope, el juego MUST impedir crear o aceptar más y decir por qué.
- **FR-003**: Al programarla, el creador MUST ocupar directamente uno de los 5 huecos y depositar su fianza.
- **FR-004**: El creador MUST poder cancelarla antes de que abra la sala; al cancelarla se devuelven todas las fianzas
  y se avisa a los apuntados.

**Tablón y aceptar**

- **FR-005**: El juego MUST mostrar un tablón con las incursiones programadas aún no empezadas: incursión, hora de
  comienzo, huecos ocupados (n/5) con los apodos, nivel de entrada, creador y premios.
- **FR-006**: Un jugador MUST poder aceptar una incursión con huecos libres; al aceptar ocupa un hueco y deposita una
  fianza del 10% de su dinero en ese momento (redondeado hacia abajo).
- **FR-007**: Los huecos MUST asignarse por orden de aceptación; con 5/5 no se admiten más.
- **FR-008**: El jugador MUST ver sus incursiones aceptadas con la cuenta atrás hasta que abra la sala.
- **FR-008b**: Un apuntado (no el creador) MUST poder darse de baja con devolución íntegra de la fianza hasta 1 h
  antes de que abra la sala; pasado ese momento, la baja MUST NOT estar disponible y el juego MUST mostrar hasta
  cuándo se puede.
- **FR-009**: Aceptar MUST NOT exigir tener la llave, pero el anuncio MUST indicar si el jugador la tiene.
- **FR-009b**: Crear o aceptar una incursión MUST exigir tener al menos un Pokémon cuyo nivel esté dentro del nivel de
  entrada de esa incursión (aunque ahora esté de expedición o en otra actividad); sin él, el anuncio MUST decir por
  qué no se puede aceptar.

**Fianza**

- **FR-010**: La fianza MUST descontarse del dinero del jugador al aceptar o crear y quedar visible como depositada.
- **FR-011**: La fianza MUST devolverse íntegra al hacer el checkin.
- **FR-012**: La fianza de quien no hace el checkin MUST repartirse a partes iguales (redondeando hacia abajo) entre
  los apuntados que sí lo hicieron, a la hora de comienzo, también si la incursión se cancela por no haber nadie con
  Pokémon marcado (FR-023); si nadie hizo el checkin, se pierde. Solo cuando cancela el creador no hay reparto (se
  devuelven todas). Cada uno MUST ver lo que ha recibido por el reparto.
- **FR-013**: Lo que se descuenta como fianza MUST NOT contar como dinero gastado para las misiones diarias, y la
  devolución MUST NOT contar como dinero ganado. El reparto de fianzas ajenas cuenta como un premio más. El ranking de
  dinero MUST sumar las fianzas retenidas, para que apuntarse no haga bajar puestos.

**Checkin y sala**

- **FR-014**: La sala MUST abrirse 10 min antes de la hora de comienzo; antes no se puede hacer el checkin.
- **FR-015**: Solo los apuntados MUST poder hacer el checkin.
- **FR-016**: Al hacer el checkin MUST marcarse el primer Pokémon disponible de la lista del jugador (mismo orden que el
  selector de Pokémon: favoritos primero y luego por nivel) que cumpla el nivel de entrada, con su ataque por defecto.
- **FR-017**: Hasta la hora de comienzo, el jugador MUST poder cambiar el Pokémon y el ataque marcados, salvo que haya
  fijado.
- **FR-018**: El botón «Fijar» MUST bloquear el Pokémon y el ataque hasta que empiece la incursión; no se puede
  deshacer.
- **FR-019**: Todos los de la sala MUST ver quién ha hecho el checkin, qué Pokémon lleva cada uno y si lo ha fijado.

**Comienzo**

- **FR-020**: La incursión MUST empezar siempre a su hora de comienzo, nunca antes, aunque todos hayan hecho el checkin
  y fijado. A esa hora MUST empezar con los jugadores que hicieron el checkin y tienen un Pokémon marcado (marcar
  exige la llave), cada uno con lo que tenga marcado. Desde que se marca hasta el comienzo, el Pokémon y una llave de
  esa incursión quedan reservados.
- **FR-021**: Se MUST gastar una llave de esa incursión a cada jugador que entra, y solo entonces.
- **FR-022**: Los huecos vacíos MUST completarse con bots, con las reglas actuales de bots.
- **FR-023**: Si ningún jugador cumple lo de FR-020, la incursión MUST cancelarse sin gastar llaves.
- **FR-024**: Desde que empieza, la incursión MUST jugarse igual que hoy (tramos, toques, reorganizar, retirada por
  votación, premios).

**Avisos**

- **FR-025**: Al programarse una incursión, MUST enviarse un aviso al móvil a todos los jugadores con las
  notificaciones de incursiones activadas, salvo al creador, tengan o no un Pokémon apto (no se filtra por nivel ni
  por incursión).
- **FR-026**: Los ajustes de notificaciones MUST incluir un interruptor propio para las incursiones programadas.
- **FR-027**: A cada apuntado MUST llegarle un aviso al abrirse la sala del checkin.

**Premios en el anuncio**

- **FR-028**: El anuncio de cada incursión programada (tablón y detalle) MUST mostrar sus premios: los de cada sala de
  combate y el premio final, iguales a los de su ficha de información.

**Pantallas**

- **FR-031**: La pestaña Ruta › Incursiones, sin incursión en curso ni sala abierta con checkin hecho, MUST organizarse
  en tres subpestañas:
  - **Tablón**: las incursiones programadas por otros jugadores, con hora, huecos (n/5), creador, nivel de entrada,
    premios, si el jugador tiene la llave, la fianza que pagaría y, si no puede aceptarla, el motivo (llena, sin Pokémon
    apto, tope alcanzado).
  - **Mis incursiones**: las creadas y aceptadas, con cuenta atrás, hasta cuándo puede darse de baja, «Darse de baja»
    (o «Cancelar» si es el creador) y «Entrar a la sala» cuando está abierta.
  - **Programar**: las incursiones disponibles (las tarjetas de hoy) con «Programar», que pide la franja de hora y
    avisa de la fianza; la de prueba, y todas sin servidor, con «Jugar ya» con bots.
- **FR-032**: Al entrar en la pestaña MUST abrirse «Mis incursiones» si el jugador tiene alguna pendiente y, si no,
  «Tablón». Abrir el aviso de una incursión nueva MUST llevar al Tablón; el de sala abierta, a «Mis incursiones».
- **FR-033**: La sala del checkin MUST ocupar la pestaña entera (como hoy la búsqueda de grupo): cuenta atrás hasta el
  comienzo, los 5 huecos (apodo, Pokémon, si ha fijado) y, abajo, el Pokémon y el ataque marcados del jugador con
  «Cambiar» y «Fijar». Desde la hora de comienzo, la incursión se ve como hoy.

**Convivencia**

- **FR-029**: Sin servidor, la incursión MUST seguir jugándose en local con bots y al momento, como hoy.
- **FR-030**: Las incursiones programadas MUST sustituir a la cola automática: con otros jugadores solo se juega
  programándolas. La de prueba (gratuita) y el juego sin servidor siguen al momento con bots.

### Key Entities

- **Incursión programada**: qué incursión, hora de comienzo, creador, estado (abierta a apuntarse, sala abierta,
  empezada, cancelada) y lista de huecos.
- **Hueco**: jugador (apodo), fianza depositada, si hizo el checkin, Pokémon y ataque marcados y si los ha fijado.
- **Fianza**: cantidad depositada por un jugador en una incursión concreta y si se ha devuelto, perdido o repartido.
- **Suscripción a avisos de incursiones**: si el móvil del jugador quiere recibir los avisos de incursiones nuevas.

## Choques con el diseño actual

Aprobados por el usuario el 2026-11-17 (respuestas a las preguntas de `/speckit-specify`: la cola se sustituye).

| Hoy (referencia) | Propuesta | Alternativa que lo preserva |
|---|---|---|
| El grupo se forma con una **cola automática** de 1 min y se completa con bots (`docs/incursiones.md` › Decisiones tomadas › Grupo; `online/protocol.ts › QUEUE_MAX_MS`) | **Se sustituye** por incursiones programadas con hora fija (FR-030) | Descartada: mantener la cola como «Jugar ya» |
| Se elige Pokémon y movimiento **antes** de entrar en la cola (Recorrido del jugador › Preparación) | Con otros jugadores, se elige en la sala del checkin, con el primer disponible marcado y «Fijar»; sin servidor, como hoy | — |
| La llave se **gasta al formarse el grupo**; cancelar la cola no la gasta (`docs/incursiones.md` › Llaves y premios) | Se gasta a la hora de comienzo a quien entra | Es la misma regla trasladada al nuevo momento |
| No existe fianza ni dinero retenido | Fianza del 10% del dinero al aceptar o crear | — |
| Temas de aviso: expediciones, obsequio, raids, ruta, intercambios (`game/core/push.ts › PushTopic`) | Tema nuevo de incursiones | Se añade junto a los existentes |
| Los avisos de raids a todos los jugadores se mandan desde el servidor (`online/raidPushes.ts`) | Mismo mecanismo para avisar de incursiones programadas | — |

**Impacto**:

- **Partidas guardadas**: la partida guarda la fianza retenida y las incursiones aceptadas ⇒ sube `SAVE_VERSION` con
  migración; si cambia la forma de la cola o de la incursión en curso, su entrada en `CARRIED_SINCE`.
- **Servidor**: tabla nueva de incursiones programadas y huecos (migración nueva), aviso a todos los suscritos
  (consumo del plan gratuito: un envío por incursión programada) y cierre de la sala a la hora por el cron.
- **Móviles sin actualizar**: la cola desaparece del servidor; deben actualizar para jugar con otros (sin servidor
  siguen jugando en local).
- **Cola guardada** (`IncursionQueue` en la partida): se cancela al migrar sin gastar la llave; su entrada en
  `CARRIED_SINCE` sube a la nueva versión.
- **Tutoriales**: la guía de incursiones y sus capturas se rehacen.
- **Anuncio**: el cambio merece una entrada en el tablón de anuncios.
- **Documentación**: `docs/incursiones.md` (Decisiones tomadas, Recorrido del jugador, Llaves, Números) y
  `docs/diseno.md` (tabla Sistemas).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un jugador programa una incursión en menos de 1 min desde la pestaña de incursiones.
- **SC-002**: Los jugadores con avisos activados reciben el aviso de una incursión programada en menos de 2 min.
- **SC-003**: En el 100% de los casos, quien hace el checkin recupera exactamente la fianza depositada.
- **SC-004**: En el 100% de los casos, la incursión empieza a su hora (con un margen de 1 min) y cada jugador entra
  con el Pokémon que tenía marcado.
- **SC-005**: Ninguna llave se gasta en una incursión cancelada o a la que el jugador no ha entrado.
- **SC-006**: Más grupos con 2 o más jugadores reales que con la cola actual (se compara el primer mes).
- **SC-007**: En el 100% de los casos, la suma de fianzas repartidas más lo perdido por redondeo es igual a la suma de
  fianzas de quienes no hicieron el checkin.

## Assumptions

- Programar y aceptar requiere conexión al servidor y apodo, como las raids compartidas; no hace falta cuenta.
- El anuncio va a todos los jugadores; no hay invitaciones a personas concretas. «Aceptar la invitación» es aceptar
  el anuncio.
- La fianza es un 10% del dinero en el momento de aceptar; no tiene tope ni mínimo. Como en el resto del juego, no
  hay anti-trampas: el servidor confía en la partida del móvil.
- El ataque marcado al hacer el checkin es el que la preparación actual propone para ese Pokémon.
- Las incursiones gratuitas (la de prueba) no se programan: se siguen jugando al momento.
- El nivel de entrada, los bots, las salas, el combate y los premios no cambian.
- Los números (10%, 10 min, 1 h de plazo para darse de baja, 15 min de antelación mínima, 7 días máximo, límites por
  jugador) son constantes de balance con nombre, para ajustarlos a mano.
- Una incursión programada con menos de 1 h 10 min de antelación no admite bajas desde el primer momento; el anuncio
  lo indica.
