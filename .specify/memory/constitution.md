# Pokérancho Constitution

## Core Principles

### I. Lo que existe es diseño: se preserva y se negocia

Todo el comportamiento que hoy tiene el juego es una decisión de diseño explícita, no un accidente.
La fuente de verdad de las reglas es `docs/diseno.md` (describe el juego tal como está implementado),
junto con `docs/incursiones.md` (tabla «Decisiones tomadas»), `docs/fondos.md` (estilo aprobado y
rechazado) y el código de `src/game` y `src/data`.

- Ninguna especificación, plan o tarea MUST cambiar, quitar o redefinir una mecánica, regla, número de
  balance, pantalla o flujo existente sin pasar por el **protocolo de cambio de diseño** (ver
  Governance).
- Cada especificación MUST incluir un apartado «Choques con el diseño actual» que liste las decisiones
  existentes que toca (con su referencia a `docs/` o al fichero) o diga explícitamente «ninguno».
- Ante la duda de si algo es una decisión de diseño, se trata como tal y se pregunta.
- Lo nuevo se añade **junto a** lo existente; reemplazar requiere aprobación explícita del usuario.

Razón: el proyecto acumula muchas decisiones tomadas a mano, iteración a iteración; perderlas en
silencio es el mayor riesgo de desarrollar por especificaciones.

### II. Identidad del juego: idle tipo digivice, móvil en vertical

- El jugador decide **antes** (ruta, Pokémon, ataque, enfoque); la ruta, la torre, las expediciones y
  los combates avanzan solos. La interacción en marcha se limita a lo ya diseñado (toques que suman
  pasos o potencian, anillo crítico, cambiar el ataque desde el siguiente golpe, decisiones en salas).
  Los combates no se aceleran ni se saltan.
- El progreso sigue con la app cerrada (con su tope de tiempo offline).
- Los Pokémon nuevos se consiguen juntando piezas («tickets de X») del gacha y de lo jugado; ver una
  especie es requisito para crearla.
- PWA para móvil en vertical: zonas de toque de 44 px, letra de 10 px como mínimo, sin scroll
  horizontal, respeto de las zonas seguras, «Atrás» del móvil cierra lo último abierto.
- Estética de los juegos de GBA: paleta de `styles/tokens.css`, iconos con sprites de objetos (nunca
  emojis), fondos pixel art con el estilo acordado en `docs/fondos.md`.

Razón: es lo que define la experiencia; una funcionalidad que la contradiga se negocia (Principio I).

### III. Capas en un solo sentido y lógica pura

- Dependencias solo en el sentido `ui → net → store → game → data` y `worker → game → data`.
- `src/game` es lógica pura: recibe `GameState` (y un `rng` inyectable como último parámetro), lo
  modifica y, como mucho, devuelve un resultado tipado para la UI. Sin React, DOM, `localStorage` ni
  `import` de imágenes, porque también corre en el servidor.
- Las acciones validan sus precondiciones y salen sin efecto si no se cumplen.
- La UI MUST NOT calcular reglas: lee el estado y llama a acciones con `act()`; si necesita un número
  del juego, se expone desde `src/game`.
- Los datos estáticos viven en `src/data`; el contenido nuevo es datos, y una regla nueva va antes en
  `src/game`.

Razón: permite testear todo el juego sin navegador y compartirlo con el Worker.

### IV. La partida nunca se pierde

- Todo cambio en la forma de `GameState` MUST subir `SAVE_VERSION` y migrar la partida anterior campo a
  campo (`core/saveMigration.ts`): paso en `SAVE_MIGRATIONS` con su test si un campo cambia de nombre o
  de significado, regla en `RULES` si el campo valida ids.
- Si cambian la forma o las reglas de algo que va a medias (`Run`, `Raid`, `ActiveIncursion`,
  `IncursionQueue`, `TowerRun`), se actualiza su entrada en `CARRIED_SINCE`.
- Lo conseguido no se pierde al actualizar, evolucionar, vender o intercambiar: las expediciones en
  curso terminan con sus condiciones, la Pokédex conserva lo capturado y la nube guarda copias.
- Los valores de los diccionarios (`as const`) son lo que se guarda: cambiarlos es un cambio de
  partida.

Razón: hay jugadores reales con partidas en el navegador y en la nube.

### V. Se juega sin servidor

- El juego completo MUST funcionar sin servidor: raids e incursiones con bots en local, sin cuenta y
  con la partida en `localStorage`.
- El servidor (Worker de Cloudflare + D1, plan gratuito) solo añade: salas compartidas, cuenta
  opcional y partida en la nube, intercambios, rankings, obsequio diario, regalos, push e informes de
  error. Toda petición tiene límite de tiempo (`net/apiFetch.ts`) y, si falla, se sigue en local.
- Un cambio de servidor se diseña para el plan gratuito (consultas sin cambios no escriben en D1,
  cupos de correo) y cada cambio de base de datos es una migración nueva en `migrations/`.
- Las reglas que comparten móvil y servidor viven en `src/game` (p. ej. `online/`, `tradeOps.ts`) y el
  servidor valida que los datos tengan sentido. No hay anti-trampas; es un límite aceptado.

Razón: el servidor es una mejora opcional y gratuita, no una dependencia.

### VI. Código limpio, pequeño y sin valores sueltos

- Legible antes que corto. Ficheros < 200 líneas como objetivo, divididos por responsabilidad; funciones
  que quepan en una pantalla.
- Sin código muerto, sin `any`, sin abstracciones especulativas (tres repeticiones justifican extraer).
- Nunca strings ni números sueltos para nombrar cosas del juego: diccionarios `as const` con tipo del
  mismo nombre (`NodeKind`, `PokeType`, `POKEMON`, `Rarity`…) y `Record<Union, …>` para cubrir casos.
- Toda constante de balance tiene nombre y `/** comentario */` con su unidad y su efecto.
- Identificadores en inglés; comentarios, textos de UI y documentación en español (excepto las claves
  de `IMOVE` y `Tm`, en español sin tildes ni ñ).
- En la UI se reutiliza `ui/shared/` (`Modal`, `useBackToClose`, `formatMoney`, `Sprite`…) antes de
  crear piezas nuevas.

Razón: el proyecto lo trabajan agentes que deben orientarse sin leerlo entero.

### VII. Tests de lógica que no fijan contenido ni balance

- Toda lógica nueva o modificada en `src/game` MUST tener tests en su `*.test.ts` al lado, con nombres
  en español que describan el comportamiento, cubriendo caso normal y límites.
- El azar se controla con `seqRng`; los estados se construyen con `initialState()` y acciones reales.
- Los tests MUST NOT fijar nombres, tiempos ni números del juego: usan `game/core/test-map.ts` y leen
  las constantes, para que editar datos a mano nunca rompa un test. Sobre los datos reales solo se
  comprueba la estructura.
- La UI no se testea con unidades; se verifica con `npm run dev` en viewport móvil y `npm run smoke`.

Razón: el balance se itera a mano constantemente y los tests no deben frenarlo.

### VIII. Documentación viva en el mismo cambio

- Si cambia una regla, se actualiza `docs/diseno.md` (tabla «Sistemas»: regla y constantes); si cambia
  la estructura, `docs/arquitectura.md`; si se crea, mueve o cambia de función un fichero, la tabla de
  `CLAUDE.md`. Todo en el mismo cambio.
- Si cambia una pantalla que sale en los Tutoriales, se rehacen las capturas (`npm run shots`).
- Si el cambio es visible para el jugador y relevante, se valora un anuncio en `data/announcements.ts`.

Razón: la documentación es el mapa que evita explorar el proyecto entero y el registro de las
decisiones del Principio I.

## Restricciones de plataforma y alcance

- Stack fijo: Vite 8, React 19, TypeScript 7, Vitest, oxlint; Node `>=22.13`. Servidor: Worker de
  Cloudflare con D1, correos con Brevo, push con VAPID. Añadir dependencias de ejecución requiere
  aprobación del usuario.
- Datos y sprites de PokeAPI (servidos por jsDelivr), fondos de combate de Showdown, mapas de la wiki
  de Fandom y sprites de entrenadores de WikiDex. Las especies nuevas se generan con
  `scripts/fetch-pokemon.mjs`, nunca editando `pokemon.json` a mano.
- Proyecto de uso personal: no se monetiza.
- `poke/Game/pokeproject` queda fuera de alcance: no se lee ni se toma como referencia salvo petición
  explícita.

## Flujo de trabajo y puertas de calidad

- Las tareas usan la skill del proyecto que encaje: `nuevo-contenido` (datos), `nueva-mecanica`
  (reglas), `nueva-pantalla` (UI), `fondos-pixel-art` (escenas) y `revision-limpia` (revisión).
- Contenido de rutas, incursiones, gimnasios y entrenadores: preferiblemente con el editor
  `tools/route-editor/`; escenas con `tools/scenery-lab/`; accesibilidad de especies con
  `tools/pokedex-unlocks/`.
- Números de balance y casos límite ambiguos se preguntan con una propuesta concreta antes de
  programar; la dificultad y duración de una ruta se simulan con el motor real y se anotan en
  `docs/diseno.md`. En los fondos pixel art no se toman decisiones de diseño sin el visto bueno.
- Puerta obligatoria para dar algo por terminado: `npm run check` (typecheck, lint y tests) en verde.
  Cambios de arranque, pestañas o guardado: además `npm run smoke`.
- Se responde siempre en español. Commits y despliegues solo cuando el usuario lo pide (cada push a
  `main` despliega en Cloudflare).

## Governance

**Precedencia.** Esta constitución recoge los principios; `CLAUDE.md` y `docs/` contienen el detalle
operativo y siguen vigentes. Si chocan, se avisa al usuario y se corrige el que esté mal en el mismo
cambio.

**Protocolo de cambio de diseño** (aplica el Principio I):

1. Detectar el choque en `/speckit-specify` o `/speckit-plan` y listarlo en «Choques con el diseño
   actual»: comportamiento de hoy (con referencia), propuesta y alternativa que lo preserve.
2. Indicar el impacto: partidas guardadas y migración, servidor y móviles sin actualizar, tutoriales,
   anuncios y documentación.
3. Obtener la aprobación explícita del usuario antes de planificar las tareas; sin ella se mantiene lo
   existente.
4. Al implementarlo, actualizar `docs/diseno.md` (u otro documento) para que la nueva decisión quede
   registrada como la vigente.

**Enmiendas.** Se proponen con `/speckit-constitution`, requieren aprobación del usuario y suben la
versión según SemVer: MAJOR si se quita o redefine un principio, MINOR si se añade un principio o una
sección o se amplía materialmente, PATCH para aclaraciones y redacción.

**Cumplimiento.** El «Constitution Check» de cada plan revisa los ocho principios; toda violación se
justifica por escrito o se elimina. `revision-limpia` sirve de checklist antes de cerrar una tarea
grande.

**Version**: 1.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17
