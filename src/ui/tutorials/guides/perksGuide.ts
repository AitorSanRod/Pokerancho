import { TAP_CRIT_MULT } from '../../../game/battle/attack'
import { COLLECTION_TIERS } from '../../../game/collection/typeCollection'
import { MISSIONS_PER_DAY } from '../../../data/dailyMissions'
import { BOOST_EXP_MULT, BOOST_TAP_EXP, EGG_ROUTE_CHANCE } from '../../../game/run/expBoost'
import { LEVEL_MILESTONES, MILESTONE_STAT_BONUS, STAR_TYPE_BONUS, STAR_TYPE_BONUS_MAX } from '../../../game/team/milestones'
import { formatBonus } from '../../shared/format'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

const BEST_TIER = COLLECTION_TIERS[COLLECTION_TIERS.length - 1]

export const PERKS_GUIDE: Guide = {
  id: 'perks',
  icon: ICON.Perks,
  title: 'Mejoras, misiones y toques',
  summary: 'Hitos de nivel, colección por tipo, misiones diarias, críticos y bonificación de EXP',
  steps: [
    {
      image: shot('perks-milestones'),
      title: 'Hitos de nivel',
      text: `Al llegar a ${LEVEL_MILESTONES.map((l) => `Nv. ${l}`).join(', ')}, el Pokémon gana ${formatBonus(MILESTONE_STAT_BONUS)} en todas sus stats para siempre. En su ficha, en Datos, se ven los que ya tiene.`,
    },
    {
      image: shot('perks-dex'),
      title: 'Mejoras de la Pokédex',
      text: `Capturar especies de un tipo hace que sus ataques peguen más: hasta ${formatBonus(BEST_TIER.damage)} con todas. Cada especie con 5 ★ da ${formatBonus(STAR_TYPE_BONUS)} de stats a todos los de sus tipos (hasta ${formatBonus(STAR_TYPE_BONUS_MAX)}). Todo, en Pokédex › Mejoras.`,
    },
    {
      image: shot('perks-missions'),
      title: 'Misiones diarias',
      text: `Cada día salen ${MISSIONS_PER_DAY} misiones nuevas en Menú › Misiones. Cada una tiene su premio: recógelo antes de medianoche.`,
    },
    {
      image: shot('perks-crit'),
      title: 'Toque crítico',
      text: `En los combates de ruta y contra los jefes, a veces sale un anillo sobre el rival antes del golpe de tu Pokémon: estate atento. Toca una sola vez justo cuando se cierre y el golpe hará ×${TAP_CRIT_MULT} de daño (puede tumbar al jefe). Si tocas antes, después o varias veces, falla.`,
    },
    {
      image: shot('perks-boost'),
      title: 'Huevo Suerte',
      text: `En algunas rutas (${EGG_ROUTE_CHANCE * 100} %) aparece un Huevo Suerte un momento: tócalo y va a la Mochila. Úsalo allí y la próxima ruta entera dará ×${BOOST_EXP_MULT} de EXP en los combates, +${BOOST_TAP_EXP} EXP por toque y rivales que dan la EXP de uno de tu nivel.`,
    },
  ],
}
