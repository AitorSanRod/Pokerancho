import { TRAINER_EXP_MULT } from '../../../game/run/runTrainer'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

export const GYM_GUIDE: Guide = {
  id: 'gyms',
  icon: ICON.Profile,
  title: 'Gimnasios y entrenadores',
  summary: 'Líderes, medallas y los entrenadores de las rutas',
  steps: [
    {
      image: shot('gym-route'),
      title: 'Los gimnasios',
      text: 'Cada gimnasio es una ruta de la lista, que se abre al completar la anterior. No tiene salvajes: solo entrenadores y el líder al final.',
    },
    {
      image: shot('gym-start'),
      title: 'Nivel máximo',
      text: 'Cada gimnasio pone un nivel máximo para entrar: si tu compañero lo pasa, tendrás que llevar a otro. Elige bien el ataque: el líder usa varios y siempre el que más daño te hace.',
    },
    {
      image: shot('gym-battle'),
      title: 'Contra el líder',
      text: `El líder saca su equipo uno tras otro y tu Pokémon lucha contra todos sin curarse; puedes cambiar de ataque en pleno combate. Los entrenadores de las rutas funcionan igual (sin nivel máximo) y cada Pokémon suyo da ×${TRAINER_EXP_MULT} de EXP.`,
    },
    {
      image: shot('gym-badges'),
      title: 'Tus medallas',
      text: 'Ganar al líder la primera vez da su medalla. Las tienes en Menú › Perfil, junto a tus datos de la partida.',
    },
  ],
}
