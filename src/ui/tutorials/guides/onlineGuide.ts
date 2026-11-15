import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

export const ONLINE_GUIDE: Guide = {
  id: 'online',
  icon: ICON.Account,
  title: 'Cuenta, perfil y avisos',
  summary: 'Guardar en la nube, perfil, ranking, Notificaciones y el Tablón',
  steps: [
    {
      image: shot('online-account'),
      title: 'Crea una cuenta',
      text: 'En Ajustes (el engranaje) › Cuenta. Es opcional: con ella la partida se guarda en la nube y la sigues en otro móvil, recibes el obsequio diario y puedes intercambiar y salir en el ranking.',
    },
    {
      image: shot('online-profile'),
      title: 'Tu perfil',
      text: 'En Menú › Perfil, tus medallas, cuánto llevas de cada Pokédex, tus datos de la partida y tu puesto en los rankings.',
    },
    {
      image: shot('online-ranking'),
      title: 'Rankings',
      text: 'En Menú › Ranking, los de dinero, daño a jefes y torre. Los de daño y torre empiezan de cero cada lunes y reparten premios. Para salir hace falta cuenta y apodo; si no quieres, se desactiva en Ajustes.',
    },
    {
      image: shot('online-inbox'),
      title: 'Notificaciones',
      text: 'Todo lo pendiente de recoger está en Menú › Notificaciones, con su contador: premios de raid, regalos, el obsequio y lo de los intercambios. Uno a uno o con «Recoger todo».',
    },
    {
      image: shot('online-board'),
      title: 'Tablón',
      text: 'Las novedades del juego. La más nueva sale una vez al entrar; las demás, en Menú › Tablón. En Ajustes › Notificaciones activas los avisos con la app cerrada.',
    },
  ],
}
