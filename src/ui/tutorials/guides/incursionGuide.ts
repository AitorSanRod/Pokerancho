import { MAX_KEYS } from '../../../data/incursions'
import { REGROUP_MS } from '../../../game/incursion/activeIncursion'
import { QUEUE_MAX_MS } from '../../../game/incursion/online/protocol'
import { PARTY_SIZE } from '../../../game/incursion/party'
import { INCURSION_REVIVES } from '../../../game/incursion/revives'
import { DEFAULT_TAP_BONUS, DEFAULT_TAP_GOAL } from '../../../data/incursionMoves'
import { TAP_WINDOW_MS } from '../../../game/incursion/tapWindow'
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
      text: `Cada incursión pide su llave. Se compran en la Tienda, en «Llaves de incursión», y puedes tener hasta ${MAX_KEYS} de cada una. Se gasta una cuando se forma el grupo.`,
    },
    {
      image: shot('inc-info'),
      title: 'Cómo funciona',
      text: 'Este botón lo explica todo: nivel, pasivas de grupo, revivires, retirada y premios. Échale un vistazo la primera vez.',
    },
    {
      image: shot('inc-prep'),
      title: 'Prepara a tu Pokémon',
      text: 'Elige un Pokémon del rancho con el nivel de la incursión y un movimiento de su repertorio. Ese movimiento decide su papel en el grupo: golpear, curar, provocar para llevarse los golpes, subir stats (al grupo o a sí mismo), bajarlas a los rivales o poner estados.',
    },
    {
      image: shot('inc-queue'),
      title: 'Busca grupo',
      text: `Se busca a otros entrenadores durante ${seconds(QUEUE_MAX_MS)}; si no llegáis a ${PARTY_SIZE}, el grupo se completa con bots. Si cancelas antes, no pierdes la llave.`,
    },
    {
      image: shot('inc-battle'),
      title: 'La incursión',
      text: `El combate va solo, por turnos. Arriba a la derecha, los ${INCURSION_REVIVES} revivires del grupo: quien cae vuelve al turno siguiente mientras queden. Sin ellos, se queda mirando. Bajo la escena, «Tu ataque»: tócalo cuando quieras para cambiar el ataque y a quién va, desde el turno siguiente. Debajo, los PS de todos; el detalle de cada uno, las pasivas y la retirada, plegados más abajo. Puedes cerrar la app: al volver, sigue por donde va.`,
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
