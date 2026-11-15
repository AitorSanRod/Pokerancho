import { RAID_REVIVES_EACH } from '../../../game/raid/raidFight'
import { RAID_LATE_JOIN_MIN_HP } from '../../../game/raid/raidLateJoin'
import { RAID_ROOM_SIZE } from '../../../game/raid/raidRoom'
import { RAID_FIGHT_MS, RAID_LOBBY_MS } from '../../../game/raid/raidSchedule'
import { formatMinutes, formatPercent } from '../../shared/format'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

export const RAID_GUIDE: Guide = {
  id: 'raids',
  icon: ICON.Raid,
  title: 'Raids',
  summary: 'Luchar en grupo contra los jefes comunitarios',
  steps: [
    {
      image: shot('raid-tab'),
      title: 'Entra en Raids',
      text: `En la pestaña Ruta, toca el icono de arriba a la derecha. Arriba eliges el jefe: el Normal o el de Difíciles. Cada jefe abre su sala ${formatMinutes(RAID_LOBBY_MS / 60_000)} antes de la pelea, a la misma hora para todos.`,
    },
    {
      image: shot('raid-join'),
      title: 'Entra en la sala',
      text: `Toca «Entrar en la sala», elige a un Pokémon del rancho (algunos jefes piden un nivel mínimo) y el ataque con el que empieza. Caben ${RAID_ROOM_SIZE}: los bots llenan los huecos y dejan su sitio a cada jugador que llega.`,
    },
    {
      image: shot('raid-send'),
      title: 'Hasta que empiece',
      text: `Mientras la sala está abierta puedes cambiar de Pokémon o de ataque, o salir. Con la pelea ya empezada aún puedes entrar, en el sitio de un bot, mientras al jefe le quede más del ${formatPercent(RAID_LATE_JOIN_MIN_HP)} de su vida.`,
    },
    {
      image: shot('raid-nickname'),
      title: 'Tu apodo',
      text: 'La primera vez eliges el apodo con el que te verán los demás jugadores de la sala. Puedes cambiarlo en Ajustes.',
    },
    {
      image: shot('raid-battle'),
      title: 'La pelea',
      text: `Dura como mucho ${formatMinutes(RAID_FIGHT_MS / 60_000)} y va como el jefe de una incursión: por turnos, con ataques de daño y ${RAID_REVIVES_EACH} revivires para cada Pokémon. Arriba ves la vida del jefe y el tiempo; abajo cambias tu ataque cuando quieras; antes de cada turno, toca rápido para potenciarlo; y si sale un anillo sobre el jefe, toca cuando se cierre: tu siguiente golpe será crítico.`,
    },
    {
      image: shot('raid-prize'),
      title: 'Recoge el premio',
      text: 'Al acabar, el premio va por la parte de la vida del jefe que le hayáis quitado desde que entraste: entero si cae. Recógelo en la pelea; si no, al acabar la hora llega a Notificaciones. Las paradas de jefe de algunas rutas son un combate más de la ruta, con su premio de raid.',
    },
  ],
}
