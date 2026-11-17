import { NATURE_MOD } from '../../../game/team/natures'
import { formatBonus } from '../../shared/format'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

export const MON_GUIDE: Guide = {
  id: 'mon',
  icon: ICON.Ranch,
  title: 'Tu Pokémon a fondo',
  summary: 'Naturaleza, Mentas, MT, favoritos, la Caja y los ranchos',
  steps: [
    {
      image: shot('mon-data'),
      title: 'Sus datos',
      text: `En la ficha, Datos dice sus tipos, sus stats, su ataque y sus hitos. Cada Pokémon tiene una naturaleza que sube una stat un ${formatBonus(NATURE_MOD)} (lleva ▲) y baja otra lo mismo (▼); algunas no cambian nada.`,
    },
    {
      image: shot('mon-mint'),
      title: 'Mentas',
      text: 'Con una Menta aleatoria de la Tienda, sale la sección Naturaleza: dice cuál tiene y la cambia por otra al azar.',
    },
    {
      image: shot('mon-tm'),
      title: 'MT',
      text: 'Las MT (premio de incursiones o de intercambios) enseñan para siempre un ataque de incursión a los Pokémon de ciertos tipos. Si tienes alguna que pueda aprender, sale la sección MT en su ficha.',
    },
    {
      image: shot('mon-favorite'),
      title: 'Favoritos',
      text: 'El corazón de arriba lo marca como favorito: sus tickets y él quedan protegidos en la trituradora, la venta y los intercambios (salvo en la sección Favoritos de las dos primeras) y en la Pokédex se pueden filtrar.',
    },
    {
      image: shot('mon-box'),
      title: 'Ranchos y Caja',
      text: 'Abajo, «Mover a…» lo lleva a otro rancho o a la Caja. Los de la Caja no ocupan sitio ni cuentan para las pasivas; los de cada rancho suman a las de ese rancho.',
    },
  ],
}
