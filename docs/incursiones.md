# Incursiones

> Estado: **se puede jugar**, con otros jugadores por el servidor (cola de 1 min y, si no llegan a cinco, bots) o, sin
> servidor, en local con bots. Hay guía en Tutoriales (menú del rancho). Falta el fondo de la Cueva Helada. Los números están en la tabla
> [Números](#números) y son un punto de partida para ajustar a mano.

Una incursión es una mazmorra clásica para **5 jugadores**: una ruta de salas escritas a mano (combates, curación,
revivir, reorganizar ataques y un jefe final) que el grupo recorre junto. Antes de entrar, cada jugador elige **un
Pokémon y un movimiento**; a partir de ahí el combate es automático y por turnos. El grupo comparte **3 revivires**.
Debe ser exigente: con un grupo mal compuesto (sin curación, sin nadie que aguante, sin cobertura de tipos) se pierde.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Ritmo | Por turnos y automático. Lo que se decide (movimiento) se elige antes de entrar o en las salas de reorganizar |
| Ataques | Uno por Pokémon (más adelante, varios con condiciones). Cada Pokémon tiene su **repertorio**: como mucho dos por tipo (su mejor ataque de daño y el de apoyo del tipo) más los propios de la especie. MTs: previstas, pero no se usan aún |
| Roles | Libres: el papel lo da el movimiento elegido (daño, curar, provocar, apoyo) |
| Grupo | Cola automática de 5. Si en **1 min** no se llena, se completa con bots |
| Salas | Escritas a mano en cada incursión: combate, curar, revivir, reorganizar ataques, jefe. PS y estados se arrastran entre salas |
| Rivales | Escritos a mano, sala por sala |
| Revivires | 3 para el grupo, automáticos al caer: vuelve al turno siguiente con la mitad de sus PS |
| Caído sin revivir | Sigue viendo la incursión hasta el final, pero su Pokémon no actúa ni aporta pasivas |
| Pasivas | Propias de incursión y **de grupo**: se cuentan con los tipos de los 5 Pokémon, cada uno vale 1/2/3/4 según su rareza. Cuando se rehagan las de rancho, se unifican |
| Retirada | Por votación de los jugadores (no bots): hace falta la mitad redondeada hacia arriba (1→1, 2→1, 3→2, 4→2, 5→3). Al retirarse (o perder) cada uno se queda con lo ganado por el camino |
| Reorganizar | 1 min 30 s para cambiar de movimiento; quien no lo cambie sigue con el suyo |
| Entrada | Solo Pokémon entre el nivel mínimo y el máximo de la incursión (Cueva Helada: 20–45). Los bots, del mínimo a +4, sin pasar del máximo |
| Nivel | Sin ajustes: cada Pokémon lucha con su nivel y cada rival tiene el suyo, escrito a mano y subiendo sala a sala (Cueva Helada: rivales de Nv. 20 a 37). Un Pokémon de nivel alto pega más y la incursión acaba antes |
| Ataque y objetivo | En plena pelea, cuando quieras, cambias el ataque de tu Pokémon y a quién lo dirige (rival o aliado según el ataque, o automático). Vale desde la siguiente ventana de toques y sigue así hasta que lo cambies; si el elegido cae o cambia la sala, vuelve a automático |
| Estados alterados | Duran como mucho 5 turnos (volver a ponerlo reinicia la cuenta) y se quitan al acabar cada sala |
| Duración | 15–25 min, según los niveles del grupo (cuanto más fuerte, antes caen los rivales) |
| Pokémon dentro | Sale del rancho como en una expedición; vuelve al terminar con los PS que le queden |
| Acceso | Con una **llave** de esa incursión, comprada en la Tienda (fácil 10.000 ₽, media 30.000 ₽, difícil 50.000 ₽; como mucho 10 de cada una); se gasta al formarse el grupo |
| Información | Un apartado en la pestaña que explica cómo funciona todo (grupo, movimientos, pasivas, revivires, nivel, retirada, llaves) |
| Premios | Escritos a mano: ₽ y EXP en cada sala de combate superada; al terminar, ₽, EXP, tickets y **tickets de cualquier Pokémon** que elijamos |
| Dónde | Nueva pestaña **Incursiones** arriba en Ruta, junto a Rutas y Raids |
| Primera incursión | **Cueva Helada**, jefe final **Gyarados**. Además, una **Incursión de prueba** (Nv. 5–20, cinco salas, una de cada tipo, unos 6 min) para probar el modo |

## Recorrido del jugador

```
  Ruta › Incursiones
        │
        ▼
 ┌────────────────────┐   elige incursión (y dificultad)
 │  Lista de          │   nivel mínimo, llaves que tiene,
 │  incursiones       │   premios posibles, salas que tiene
 └─────────┬──────────┘
           ▼
 ┌────────────────────┐   1 Pokémon del rancho (Nv ≥ mínimo)
 │  Preparación       │   1 movimiento de su repertorio
 │                    │   ve sus tipos y cuánto suma a las pasivas
 └─────────┬──────────┘
           ▼
 ┌────────────────────┐   «Buscando grupo… 3/5»  (cancelar: no gasta la llave)
 │  Cola              │   máx. 60 s; luego bots hasta 5
 └─────────┬──────────┘
           ▼  grupo formado: se gasta la llave, el Pokémon sale del rancho
 ┌────────────────────┐   tramo 1 → sala de reorganizar → tramo 2 → … → jefe
 │  Incursión         │   en cualquier momento: «Votar retirada» (n/votos)
 │                    │   se puede cerrar la app: al volver sigue donde va
 └─────────┬──────────┘
           ▼
 ┌────────────────────┐   victoria: premios completos
 │  Resumen           │   derrota o retirada: lo ganado por el camino
 └────────────────────┘   el Pokémon vuelve al rancho
```

## Por tramos: lo que decide el servidor y lo que simula cada móvil

Entre dos momentos de decisión nadie toca nada, así que ese **tramo** depende solo de cómo entra el grupo (Pokémon,
PS, estados, revivires que quedan, movimientos) y de una semilla. El servidor la reparte. Cada móvil corre la misma
simulación pura (`src/game/incursion/`), obtiene exactamente el mismo resultado y lo reproduce en pantalla según el
tiempo pasado, igual que una ruta.

Un tramo acaba en una **sala de reorganizar** (cada uno puede cambiar su movimiento), al terminar la incursión o si
gana la votación de retirada.

```
   cola ──► grupo formado ──► TRAMO 1 ──► sala «reorganizar» ──► TRAMO 2 ──► … ──► fin
             semilla 1          │          1:30 para cambiar        │
                                │          movimiento; quien no     │
                                │          lo hace, sigue igual     │
                                │          semilla 2 ───────────────┘
                                │
                     votación de retirada en cualquier momento:
                     si llega a los votos, la incursión termina
                     en el turno en que se alcanzó (todos lo ven igual)
```

```
  Móvil A ─┐  join (Pokémon + movimiento)      ┌─► simula(tramo, semilla) ─► mismo resultado
  Móvil B ─┤  poll: cada 3 s en cola,          │
  Móvil C ─┼──  cada 10 s en la incursión ──►  Worker  ─┼─► simula(tramo, semilla) ─► mismo resultado
  Móvil D ─┤  vote / move en las salas          │
  Móvil E ─┘                │                   └─► …
                            ▼
                   D1: cola + grupos
                   (grupo = incursión, 5 instantáneas, tramos con su semilla
                    y hora de inicio, movimientos elegidos, votos)
```

Esto aporta:

- **Coste bajo en el servidor** (plan gratuito de Cloudflare): una consulta cada 10 s con la incursión abierta, ninguna
  con la app cerrada. El servidor no simula combates: guarda decisiones y tiempos.
- **Quien cae sigue viendo** sin nada especial, porque es una repetición.
- **Sin servidor también se juega**: grupo en local con 4 bots, sin votación (retirarse es inmediato).
- **Quien cierra la app no bloquea**: en las salas de reorganizar se sigue al acabar el plazo con lo que hubiera.

### Retirada por votación

- Votan los **jugadores**, no los bots, estén o no en pie. Hacen falta `ceil(jugadores / 2)` votos.
- El voto se puede retirar mientras no se llegue al número.
- Al llegar, el servidor apunta el **turno** del tramo en que ocurrió (calculado con la hora y la línea de tiempo): todos
  los móviles cortan la repetición en ese mismo punto.
- Al retirarse, cada uno se queda con lo ganado en las salas superadas hasta ese momento (como al perder); el premio
  final solo se da al terminarla.

## Combate de grupo

```
  Turno
  ┌──────────────────────────────────────────────────────────────┐
  │ 1. Revivir: cada caído del turno anterior, si quedan         │
  │    revivires del grupo, vuelve con 50% PS (gasta 1 de 3)     │
  │ 2. Pasivas del grupo: se recalculan con los que siguen en pie│
  │    (un caído sin revivir deja de sumar)                      │
  │ 3. Orden por Velocidad: aliados y rivales mezclados          │
  │ 4. Cada uno usa su movimiento:                               │
  │      daño     → rival (el más débil a su tipo; empate: azar) │
  │      curar    → aliado con menos PS (fracción)               │
  │      provocar → los rivales le atacan a él N turnos          │
  │      apoyo    → sube Ataque/Defensa del grupo N turnos       │
  │      debilitar→ baja Defensa del rival o le pone un estado   │
  │    Rivales: aliado al azar; si alguien provoca, a ese.       │
  │    Jefes: además, ataques en área y mecánicas propias        │
  │ 5. Fin de turno: estados (quemadura, veneno…), regeneración  │
  │ 6. ¿Todos los rivales caídos? → siguiente sala               │
  │    ¿Todo el grupo caído y sin revivires? → derrota           │
  └──────────────────────────────────────────────────────────────┘
```

Para que sea **exigente** (cada incursión elige cuáles usa):

- **PS arrastrados**: solo se cura en las salas de curar. Sin curador, el grupo llega al jefe sin vida.
- **Jefe con furia**: pasados unos turnos, su Ataque sube cada pocos turnos. Un grupo sin daño pierde aunque aguante.
- **Ataques en área**: castigan a los grupos sin curación.
- **Golpes fuertes contra uno**: castigan a los grupos sin nadie que provoque.
- **Fases**: a cierto % de PS el jefe cambia de ataque o llama a refuerzos.
- **Tipos**: cada incursión tiene un tema de tipos; llevar solo un tipo no basta.

## Toques antes de cada turno

Antes de cada turno del grupo hay una **ventana de toques** de 5 s: toda la escena es un botón y, si el jugador llega a
50 toques, su Pokémon hace un **10% más de daño** ese turno (`game/incursion/tapWindow.ts`). Solo hay ventana si queda
en pie algún Pokémon de un jugador (los bots no tocan); quien no mira, sigue sin potenciar.

Es la única decisión dentro de un tramo, así que la simulación **se para en cada ventana** de la que aún no se sabe el
resultado y sigue cuando se sabe, igual en todos los móviles. La ventana es un evento más de la línea de tiempo (5 s de
toques + 1,5 s para ver el resultado), así que todos saben exactamente cuándo empieza y acaba. Las órdenes de cada tramo
guardan quién potenció su ataque en cada ventana (`LegOrders.taps`).

- **Sin servidor**: al llegar a los toques se apunta enseguida; al pasar la hora, la ventana se cierra sin potenciar
  (`incursionGame.ts › boostIncursionTap`, `advanceIncursion`).
- **Con servidor**: al llegar a los toques el móvil avisa (`IncursionAction.Tap`); el servidor cierra la ventana 0,75 s
  después de que acabe con los que avisaron a tiempo (`sharedIncursion.ts › TAP_CLOSE_DELAY_MS`) y los móviles
  consultan enseguida para tenerlo antes de que empiece el turno. Si no llega a tiempo, se ve «Esperando a los toques del
  grupo…».
- **Con la app cerrada**: las ventanas pasadas se cierran todas de una vez, sin nadie (`tapSettle.ts › settleTaps`).

Las partidas e incursiones guardadas de antes no tienen `taps`: se leen como «ninguna ventana cerrada aún», así que no
hizo falta subir `SAVE_VERSION`.

## Salas (a mano)

Cada incursión es una lista de salas en `data/incursions.ts`, como las paradas de una ruta:

| Sala | Qué hace |
|---|---|
| Combate | Rivales escritos a mano (especie, nivel, movimiento, pasivas) |
| Jefe | Como combate, con mecánicas (furia, área, fases, refuerzos) |
| Curar | Recupera un % de PS a todos los que siguen en pie |
| Revivir | Devuelve revivires al grupo o levanta a los caídos |
| Reorganizar | Cada jugador puede cambiar su movimiento (plazo de 1 min 30 s). Cierra un tramo |

Ejemplo de esbozo, **Cueva Helada** (jefe **Gyarados**, agua/volador): rivales de hielo y agua (Seel, Shellder,
Jynx…), un minijefe (Dewgong o Cloyster), una sala de curar, otra de reorganizar antes del jefe y Gyarados con ataque
en área y furia. Lleva a pensar en eléctrico y roca para el jefe, y en fuego o lucha para la cueva. Hace falta un fondo
de cueva helada (variante de `cave` o bioma nuevo, con la skill `fondos-pixel-art`).

## Movimientos y repertorio

Las rutas y raids siguen con su ataque único (`signatureMove`). En las incursiones, cada movimiento tiene un **efecto**
(`data/supportMoves.ts › MoveKind`):

| Efecto | Qué hace | A quién |
|---|---|---|
| `Damage` | Los ataques de daño de siempre (`data/moves.ts`) | Al rival más débil a su tipo (empate, al azar). Los rivales, a uno al azar |
| `Heal` | Cura una fracción de los PS máximos | Al aliado con menos PS en proporción (o a todos, con `area`) |
| `Taunt` | Atrae los golpes de los rivales unos turnos y recibe menos daño (`guard`) | A sí mismo |
| `Boost` | Sube stats unos turnos | A todo el grupo |
| `Debuff` | Baja stats unos turnos | Al rival con más PS (o a todos, con `area`) |
| `Inflict` | Pone un estado alterado | A un rival sin estado (o a todos, con `area`) |

Los golpes, bajadas y estados contra un solo rival van al que provoca, si hay alguno. El mismo movimiento renueva su
cambio de stats en vez de sumarlo otra vez (cinco con Danza Dragón no la quintuplican).

**Repertorio** (`game/incursion/repertoire.ts`): como mucho **dos por tipo**. De cada uno de sus tipos, el ataque de
daño del escalón más alto al que llega (sin pasar de su rareza y desde su nivel, `learnsets.ts › DAMAGE_TIER_LEVELS`) y
el ataque de apoyo del tipo desde su nivel (`supportMoves.ts`, uno por tipo); además, los propios de su especie
(`learnsets.ts › SPECIES_MOVES`). Las MTs, más adelante.

Cada tipo tiene su papel en el grupo por su ataque de apoyo (y sus pasivas de grupo van en la misma línea):

| Papel | Tipos |
|---|---|
| Aguantar (provocar) | Acero (el que más aguanta) y roca. Sus pasivas de grupo son las más defensivas |
| Curar | Planta (la cura más fuerte a uno) y agua (la única que cura a todo el grupo); sus pasivas regeneran. Normal, psíquico y hada curan menos |
| Subir stats al grupo | Hielo (Defensa), lucha, bicho y dragón (Ataque y Velocidad), volador (Velocidad) |
| Bajar stats a los rivales | Tierra (Ataque de todos), siniestro (Defensa de uno) |
| Estados | Fuego (quemar), eléctrico (paralizar), veneno (envenenar), fantasma (confundir) |

## Pasivas de grupo

Cada Pokémon del grupo suma a cada uno de sus tipos un **peso según su rareza**. Las pasivas son propias de incursión
(`data/incursionPassives.ts`, editable a mano) y valen para los 5. Se recalculan al empezar cada turno: un caído sin
revivir deja de sumar. Cuando se rehagan las pasivas de rancho, se unifican con estas.

```
  Peso por rareza:  Común 1 · Rara 2 · Épica 3 · Legendaria 4   (los de dos tipos suman en ambos)

  Ejemplo de grupo:
    Charizard (épico, fuego/volador) → fuego +3, volador +3
    Arcanine  (épico, fuego)         → fuego +3
    Ponyta    (raro, fuego)          → fuego +2
    Lapras    (épico, agua/hielo)    → agua +3, hielo +3
    Clefable  (rara, hada)           → hada +2

    Fuego 8 → nivel 2      Volador 3 → nivel 1      Agua 3 → nivel 1      Hielo 3 → nivel 1

  Umbrales: 3 → nivel 1 · 6 → nivel 2 · 10 → nivel 3

  Si cae Charizard y no quedan revivires: fuego 5 → nivel 1 y volador 0 → sin pasiva.
```

## Llaves y premios

- **Llave de incursión**: un objeto por incursión que se compra en la Tienda y se guarda en la Mochila. Se gasta al
  formarse el grupo; si se cancela la cola, no. Precio según la dificultad de la incursión (`data/incursions.ts ›
  KEY_PRICE`: fácil 10.000 ₽, media 30.000 ₽, difícil 50.000 ₽); como mucho 10 de cada una (`MAX_KEYS`).
- **Por el camino**: cada sala de combate superada da su ₽ y EXP (`reward`), que se cobran aunque luego se pierda o se
  retire el grupo.
- **Al terminarla**: la tabla `prizes` de la incursión (₽, EXP, tickets y tickets de especie; cada línea se tira por
  separado).

## Bots

Están previstos desde el principio, aunque lo normal sea jugar con personas. Entran solo si la cola no se llena en
60 s o sin servidor. Llevan una especie de la lista `bots` de la incursión, del nivel mínimo a +4, y un movimiento que
cubre lo que le falte al grupo: si nadie cura, cura; si nadie provoca, provoca; si no, su golpe más fuerte. No votan.

## Números

Simulado con la Cueva Helada (100 partidas por caso): un grupo bien montado (curador, tanque y tres de daño con
cobertura) gana un 60% a nivel 30 con un curador de planta (la dificultad buscada, por ahora); con uno de agua, un
70%, y con uno que no sea de planta ni de agua, un 25%. Sin ajuste de nivel (rivales de Nv. 20 a 37), el mismo grupo
de planta sin tocar nunca gana un 3% a Nv. 28, un 72% a Nv. 30 (17 min de combate) y siempre de Nv. 32 en adelante,
cada vez más rápido (13 min a Nv. 35, 9 min a Nv. 45). Tocando, pega más. Cinco bots casi nunca ganan: están para
completar.

| Qué | Valor | Dónde |
|---|---|---|
| PS de los rivales | ×8 (los jefes, además, su `hpMult`) | `game/incursion/fighter.ts › FOE_HP_MULT` |
| Ataque de los rivales | ×0,67 | `fighter.ts › FOE_ATK_MULT` |
| Bajada máxima de una stat | hasta el 25% de la suya | `fighter.ts › MIN_STAT_MULT` |
| Estados alterados | 5 turnos como mucho | `groupStatus.ts › STATUS_MAX_TURNS` |
| Revivires | 3, vuelve con el 50% | `revives.ts › INCURSION_REVIVES, REVIVE_HP` |
| Golpe en área de un jefe | 60% del daño a cada uno | `moveEffects.ts › AREA_DAMAGE_MULT` |
| Turnos por sala | 80 como mucho (luego se pierde) | `groupBattle.ts › MAX_ROOM_TURNS` |
| Confusión | se quita el 10% de sus PS | `groupStatus.ts › CONFUSION_SELF_HIT` |
| Grupo y bots | 5; bots del mínimo a +4 | `party.ts › PARTY_SIZE, BOT_LEVEL_SPREAD` |
| Toques | 5 s de ventana + 1,5 s de resultado; 50 toques dan +10% de daño ese turno; el servidor cierra a los 0,75 s | `tapWindow.ts › TAP_WINDOW_MS, TAP_SETTLE_MS, TAP_GOAL, TAP_BONUS`, `online/sharedIncursion.ts › TAP_CLOSE_DELAY_MS` |
| Ritmo en pantalla | ms de cada evento | `incursionTimeline.ts › INCURSION_EVENT_MS` |
| Pasivas | pesos 1/2/3/4, umbrales 3/6/10 | `data/incursionPassives.ts` |
| Llaves | 10.000 / 30.000 / 50.000 ₽, máx. 10 | `data/incursions.ts › KEY_PRICE, MAX_KEYS` |

| Reorganizar | 90 s | `activeIncursion.ts › REGROUP_MS` |
| Cola | 60 s como mucho; sin consultar 20 s, se sale | `online/protocol.ts › QUEUE_MAX_MS, QUEUE_STALE_MS` |
| Grupos en el servidor | se borran tras 24 h sin consultas | `online/protocol.ts › GROUP_TTL_MS` |
| Consultas | cada 3 s en la cola y al reorganizar; cada 10 s jugando un tramo | `net/incursionSync.ts › QUICK_SYNC_MS, PLAY_SYNC_MS` |

## Dónde está cada cosa

```
  src/data/
    incursions/              types (forma, llaves, `foe`), index (lista e `incursion(id)`), un fichero por incursión:
                             cuevaHelada, prueba (corta y de nivel bajo)
    incursionPassives.ts     pasivas de grupo por tipo, pesos por rareza y umbrales
    supportMoves.ts          MoveKind y ataques de apoyo por tipo
    learnsets.ts             escalones de daño por nivel, propios por especie, battleMove(id)

  src/game/incursion/        lógica pura, con un .test.ts por fichero (piezas comunes: incursion-test-utils.ts)
    incursionRun.ts          encadenar tramos con sus órdenes; corte por retirada
    incursionLeg.ts          un tramo: salas hasta la siguiente de reorganizar o el final
    groupBattle.ts           un combate N contra M por turnos; refresca las pasivas
    battlefield.ts           los dos bandos, revivires, golpear, curar, quién gana la sala
    fighter.ts               combatiente de incursión, stats con cambios y furia
    moveEffects.ts           qué hace cada MoveKind
    targeting.ts             a quién va cada movimiento
    groupStatus.ts           estados alterados y final de turno
    bossMechanics.ts         furia, área, fases
    revives.ts               revivires del grupo y caídos que se quedan mirando
    restRooms.ts             salas de curar y revivir; salir de una sala
    groupPassives.ts         sumar pesos por tipo → nivel de cada pasiva
    movePicks.ts             cambiar de ataque y objetivo en plena pelea (a quién puede ir cada ataque)
    incursionPicks.ts        en la partida: elegirlo y dejarlo pendiente hasta la próxima ventana
    repertoire.ts            movimientos que puede llevar cada Pokémon
    party.ts                 completar con bots y su movimiento
    incursionRewards.ts      lo ganado por el camino y el premio final
    incursionTimeline.ts     cuánto dura cada evento en pantalla; ganado antes de un momento
    retreatVote.ts           votos necesarios
    entry.ts                 quién puede entrar: nivel mínimo y máximo

    keys.ts                  comprar y gastar llaves
    activeIncursion.ts       la incursión guardada (miembros, órdenes, inicio de cada tramo) y por dónde va con la hora
    incursionGame.ts         en la partida: entrar, avanzar, reorganizar, retirarse y cobrar (sin servidor)

  src/game/core/state.ts     incursion (la de ahora) e incursionKeys; MonPlace.Incursion
  src/ui/incursion/          IncursionScreen (pestaña), IncursionList + IncursionInfo + IncursionPrep, MovePicker,
                             IncursionView (en curso): IncursionStage (escena), sceneState (estado en un momento),
                             IncursionRoster, RegroupPanel, IncursionSummary
  src/ui/shop/IncursionKeyShop.tsx, Mochila (game/team/bag.ts)

  src/game/incursion/online/ con otros jugadores
    protocol.ts              peticiones (cola, salir, ponerse al día, movimiento, seguir, voto) y respuestas
    requests.ts              validar lo que llega al servidor
    sharedIncursion.ts       el grupo en el servidor: formar (pickGroup, formGroup), plazos, seguir, votos
    linkedIncursion.ts       la cola en la partida y aplicar lo que dice el servidor
  src/net/incursionApi.ts, incursionSync.ts   cliente y bucle de consultas
  src/ui/incursion/          IncursionQueueView (buscando grupo), RetreatVote
  worker/incursion.ts, worker/db/incursions.ts, migrations/0010_incursions.sql
```

## Plan por fases

1. ~~**Datos**: `MoveKind`, movimientos de apoyo, repertorios, pasivas de grupo y la Cueva Helada.~~ Hecho.
2. ~~**Motor puro**: combate de grupo, revivires, pasivas, salas, jefe, tramos, retirada, premios y
   línea de tiempo.~~ Hecho, con tests que no fijan contenido.
3. ~~**Partida**: estado, `MonPlace.Incursion`, llaves en la Tienda y la Mochila, aplicar premios, migración del
   guardado.~~ Hecho: jugable en local con 4 bots.
4. ~~**Servidor**: cola, formación del grupo a los 60 s, tramos, reorganizar, votos, tablas y cliente de red.~~ Hecho.
5. ~~**Pantallas**: pestaña, **información**, preparación, escena de grupo, sala de reorganizar, retirada y resumen.~~
   Hecho, también la cola y los votos. Queda el fondo de la Cueva Helada (ahora usa el de cueva).
6. ~~**Documentación**: fila en la tabla «Sistemas» de `diseno.md` y un tutorial.~~ Hecho: guía «Incursiones» (`ui/tutorials/guides/incursionGuide.ts`, capturas `inc-*`).

## Con y sin servidor

- **Buscar grupo**: el móvil sigue en la cola consultando cada 3 s; la llave se gasta al formarse el grupo y no se
  pierde si se cancela antes. Con la app oculta no consulta, y a los 20 s sale de la cola.
- **Durante**: el servidor decide cuándo empieza cada tramo (al acabar el plazo de reorganizar o cuando todos dan a
  seguir) y guarda los votos; cada móvil simula lo mismo. En la sala de reorganizar se ve lo que va eligiendo cada uno
  y quién está listo.
- **Sin servidor** (al buscar grupo no responde): se juega en local con 4 bots, la retirada es inmediata y se puede
  seguir sin esperar al plazo. Si el servidor olvida un grupo a medias, la incursión sigue en local.
- **Al terminar**, cada uno cobra en su partida.
