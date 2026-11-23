import { TOWER_HEAL_EVERY, TOWER_LAST_HEAL_FLOOR } from '../../../game/tower/tower'
import { TOWER_LEVEL_CAP_FLOOR } from '../../../game/tower/towerFoes'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

export const TOWER_GUIDE: Guide = {
  id: 'tower',
  icon: ICON.Tower,
  title: 'Torre infinita',
  summary: 'Subir piso a piso con tu compañero hasta que caiga',
  steps: [
    {
      image: shot('tower-tab'),
      title: 'Entra en la torre',
      text: 'En la pestaña Ruta, arriba, Torre. Ahí ves tu récord, el de esta semana (empieza de cero cada lunes) y el próximo premio: algunos pisos dan uno la primera vez de cada semana.',
    },
    {
      image: shot('tower-start'),
      title: 'Elige el ataque y comienza',
      text: 'Sube tu compañero, con el ataque que elijas en la barra. Puede ir mientras no esté en una ruta ni debilitado.',
    },
    {
      image: shot('tower-climb'),
      title: 'Sube sola',
      text: `Cada piso es un combate contra un rival un nivel más alto, y da EXP y ₽. Te curas cada ${TOWER_HEAL_EVERY} pisos, hasta el ${TOWER_LAST_HEAL_FLOOR}; desde el ${TOWER_LEVEL_CAP_FLOOR}, salen rivales de todas partes y cada uno da un ticket suyo. Sigue subiendo aunque cierres la app, hasta que caiga o la abandones; el ataque se cambia abajo cuando quieras. Al acabar, los premios se ven como al final de una ruta.`,
    },
  ],
}
