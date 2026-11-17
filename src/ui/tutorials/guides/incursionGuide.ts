import { MAX_KEYS } from '../../../data/incursions'
import { REGROUP_MS } from '../../../game/incursion/activeIncursion'
import { BOND_FRACTION, CHECKIN_OPEN_MS } from '../../../game/incursion/schedule/scheduleRules'
import { PARTY_SIZE } from '../../../game/incursion/party'
import { INCURSION_REVIVES } from '../../../game/incursion/revives'
import { DEFAULT_TAP_BONUS, DEFAULT_TAP_GOAL } from '../../../data/incursionMoves'
import { TAP_WINDOW_MS } from '../../../game/incursion/tapWindow'
import { formatMinutes, formatPercent } from '../../shared/format'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

const seconds = (ms: number) => `${Math.round(ms / 1000)} s`

export const INCURSION_GUIDE: Guide = {
  id: 'incursiones',
  icon: ICON.Incursion,
  title: 'Incursiones',
  summary: `Mazmorras para ${PARTY_SIZE} con salas, revivires y un jefe al final`,
  steps: [
    {
      image: shot('inc-tab'),
      title: 'Entra en Incursiones',
      text: `En la pestaña Ruta, toca el icono de la llave. Cada incursión es una serie de salas (combates, descansos y un jefe al final) que se recorre en grupo de ${PARTY_SIZE}.`,
    },
    {
      image: shot('inc-keys'),
      title: 'Compra una llave',
      text: `Cada incursión pide su llave. Se compran en la Tienda, en «Llaves de incursión», y puedes tener hasta ${MAX_KEYS} de cada una. Se gasta una cuando empieza la incursión.`,
    },
    {
      image: shot('inc-info'),
      title: 'Cómo funciona',
      text: 'Este botón lo explica todo: nivel, pasivas de grupo, revivires, retirada y premios. Échale un vistazo la primera vez.',
    },
    {
      image: shot('inc-board'),
      title: 'Apúntate en el tablón',
      text: `Con otros entrenadores se juega a una hora fija. En el Tablón están las incursiones que han programado, con sus huecos y sus premios. Al aceptar una se retiene una fianza (el ${formatPercent(BOND_FRACTION)} de tu dinero) que recuperas al presentarte. Las tuyas, en «Mis incursiones».`,
    },
    {
      image: shot('inc-schedule'),
      title: 'O prográmala tú',
      text: 'En «Programar», elige la incursión, el día y la hora. Ocupas el primer hueco (con tu fianza) y se avisa a quien tenga activadas las notificaciones de incursiones. Hasta una hora antes de abrir la sala, quien se apunta puede darse de baja y recuperar su fianza.',
    },
    {
      image: shot('inc-room'),
      title: 'Haz el checkin',
      text: `La sala abre ${formatMinutes(CHECKIN_OPEN_MS / 60_000)} antes. Al entrar recuperas la fianza y se marca tu primer Pokémon disponible: puedes cambiarlo, y su ataque, hasta la hora, o «Fijar» para no tocarlo más. Hace falta la llave. A la hora empieza con quien esté; los huecos libres, con bots, y la fianza de los que no vinieron se reparte entre los que sí.`,
    },
    {
      image: shot('inc-battle'),
      title: 'La incursión',
      text: `El combate va solo, por turnos. Arriba a la derecha, los ${INCURSION_REVIVES} revivires del grupo: quien cae vuelve al turno siguiente mientras queden. Sin ellos, se queda mirando. Abajo, tus ataques: toca otro cuando quieras para cambiarlo (y, debajo, a quién va), desde el turno siguiente; la «i» dice qué hace cada uno. Arriba, los PS de todos; el detalle de cada uno, las pasivas y la retirada, en «Menú». Puedes cerrar la app: al volver, sigue por donde va.`,
    },
    {
      image: shot('inc-tap'),
      title: 'Toca para potenciar tu ataque',
      text: `Antes de cada turno del grupo tienes ${seconds(TAP_WINDOW_MS)} para tocar la pantalla. Si llegas a los toques de tu ataque (${DEFAULT_TAP_GOAL} en casi todos), lo potencias ese turno (+${Math.round(DEFAULT_TAP_BONUS * 100)}%): los de daño pegan más, los de cura curan más y los de estado hacen que el resto del grupo pegue y cure más. Si no estás mirando, el turno sigue sin potenciar.`,
    },
    {
      image: shot('inc-regroup'),
      title: 'Reorganizaos',
      text: `En algunas salas hay ${seconds(REGROUP_MS)} para cambiar de movimiento viendo lo que lleva cada uno. Con «Seguir ya» avisas de que estás listo; cuando lo están todos, se sigue.`,
    },
    {
      image: shot('inc-summary'),
      title: 'Premios y retirada',
      text: 'Cada sala superada da ₽ y EXP, que te quedas pase lo que pase; al terminar llega el premio final. Si va mal, el grupo puede votar retirarse (hace falta la mitad de los jugadores) y se cobra lo ganado hasta ahí.',
    },
  ],
}
