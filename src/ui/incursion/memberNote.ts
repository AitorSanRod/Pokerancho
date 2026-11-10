import { isBot } from '../../game/incursion/party'

/** Quién lleva a un Pokémon del grupo: tú, un bot o el apodo de otro jugador */
export const memberNote = (id: string, uid: string, nicknames: Record<string, string>) =>
  id === uid ? 'Tú' : isBot(id) ? 'Bot' : (nicknames[id] ?? '')
