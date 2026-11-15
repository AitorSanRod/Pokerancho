import { species } from '../../../data/species'
import { PushTopic, type PushJob } from '../../core/push'
import { roomBoss, type RaidRoom } from '../raidRoom'
import { fightStart } from '../raidSchedule'

// Avisos push de los jefes de la pestaña Raids (tema Raid): los programa el servidor al sentar a un jugador en una sala.

/** Un aviso y a quién va: los jugadores (id de raids) */
export interface RaidPush {
  to: { playerIds: string[] }
  job: PushJob
}

/** Al entrar en la sala: se avisa al jugador cuando empiece la pelea, para que venga a elegir ataques y tocar */
export function startPush(room: RaidRoom, playerId: string): RaidPush {
  const name = species(roomBoss(room).speciesId).name
  return {
    to: { playerIds: [playerId] },
    job: {
      topic: PushTopic.Raid,
      key: `start:${room.id}`,
      dueAt: fightStart(room.cycle),
      title: `¡Empieza la raid contra ${name}!`,
      body: 'Tu Pokémon ya está luchando: entra para elegir su ataque y potenciarlo.',
    },
  }
}
