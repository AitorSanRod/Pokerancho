import type { Battlefield } from './battlefield'
import { EventKind, on } from './events'
import { partyFighter, type MemberState } from './fighter'
import { refreshPassives } from './groupBattle'
import { applyGroupPassives } from './groupPassives'
import { isBot } from './party'

// Entrar en plena pelea (la del jefe de la pestaña Raids): el Pokémon de un jugador ocupa el sitio del último bot que
// quede en el grupo, con sus PS y su ataque, al empezar el turno de la ventana en que se pidió. Sin bots, no entra.

/**
 * Sienta en el grupo a los que entran, cada uno en el sitio del último bot; `roster` (cómo entró cada uno, en el
 * orden del grupo) cambia igual
 */
export function applyJoins(bf: Battlefield, roster: MemberState[], joins: MemberState[]) {
  for (const member of joins) {
    const at = bf.party.findLastIndex((f) => isBot(f.id))
    if (at < 0 || bf.party.some((f) => f.id === member.id)) continue
    const bot = bf.party[at]
    const fighter = partyFighter(member)
    applyGroupPassives([fighter], bf.passives)
    bf.party[at] = fighter
    roster[at] = member
    bf.log(on(fighter, { kind: EventKind.Join, actor: bot.id, moveId: member.moveId, text: `¡${fighter.name} entra en la pelea!` }))
  }
  if (joins.length) refreshPassives(bf)
}
