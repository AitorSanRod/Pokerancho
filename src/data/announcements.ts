import { POKEMON } from './pokemon'

// Tablón de anuncios (Menú del rancho). Este fichero es para editarlo a mano: el anuncio nuevo va el primero.

/** Grupo de Pokémon de un anuncio, con su título (p. ej. una rotación de jefes) */
export interface AnnouncementGroup {
  label: string
  speciesIds: number[]
}

export interface Announcement {
  /** Único y para siempre: con él se recuerda si el jugador ya lo ha visto */
  id: string
  /** Fecha de publicación, AAAA-MM-DD */
  date: string
  title: string
  text: string
  groups?: AnnouncementGroup[]
}

/** Anuncios del tablón, del más nuevo al más viejo; el primero sale en una ventana al entrar hasta que se ve */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'incursiones-programadas-2026-11',
    date: '2026-11-17',
    title: 'Incursiones programadas',
    text: 'Ahora las incursiones con otros entrenadores se quedan a una hora fija. Prográmala en Ruta › Incursiones o apúntate a una del Tablón, donde ves sus premios. Al apuntarte dejas una fianza (el 10% de tu dinero) que recuperas al hacer el checkin en la sala, que abre 10 minutos antes; si no vienes, se reparte entre los que sí. Activa en Ajustes › Notificaciones las de incursiones para enterarte cuando alguien programe una.',
    groups: [{ label: 'Jefes de las incursiones', speciesIds: [POKEMON.Nidoking, POKEMON.Nidoqueen, POKEMON.Gyarados] }],
  },
  {
    id: 'raids-2026-11',
    date: '2026-11-14',
    title: '¡Las Raids han rotado!',
    text: 'Hay jefes nuevos en la pestaña Raids. Los difíciles piden más nivel, pero dan bastantes más premios. Y, a partir de ahora, las novedades del juego las encontrarás en este Tablón de anuncios, en el Menú del rancho.',
    groups: [
      {
        label: 'Normal',
        speciesIds: [
          POKEMON.Charmander,
          POKEMON.Bulbasaur,
          POKEMON.Squirtle,
          POKEMON.Totodile,
          POKEMON.Cyndaquil,
          POKEMON.Chikorita,
          POKEMON.Chespin,
          POKEMON.Fennekin,
          POKEMON.Froakie,
        ],
      },
      { label: 'Difíciles', speciesIds: [POKEMON.Houndoom, POKEMON.Flygon, POKEMON.Articuno] },
    ],
  },
]

/** El anuncio más reciente, el que se avisa al entrar; undefined si el tablón está vacío */
export const LATEST_ANNOUNCEMENT: Announcement | undefined = ANNOUNCEMENTS[0]
