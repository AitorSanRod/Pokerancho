import { useState } from 'react'
import type { Incursion } from '../../data/incursions'
import { species } from '../../data/species'
import { TYPE_INFO } from '../../data/types'
import { MonPlace, monPlace, type GameState, type OwnedMon } from '../../game/core/state'
import { act } from '../../store/store'
import { canEnter } from '../../game/incursion/entry'
import { incursionBlocker, startIncursion } from '../../game/incursion/incursionGame'
import { freePrizeSpent } from '../../game/incursion/freeIncursions'
import { keysOf, needsKey } from '../../game/incursion/keys'
import { monRepertoire } from '../../game/incursion/repertoire'
import { byPickOrder } from '../../game/team/pickOrder'
import { passiveWeightOf } from '../../game/team/ranchPassives'
import { Sprite } from '../shared/common'
import { MonPicker } from '../shared/MonPicker'
import { HeroLayout } from '../shared/sheet/HeroLayout'
import { BIOME_SCENERY } from '../shared/sheet/scenery'
import { MovePicker } from './MovePicker'
import { Modal } from '../shared/Modal'
import '../route/route-start.css'

const usable = (inc: Incursion, m: OwnedMon) => canEnter(inc, m.level) && m.hp >= 1

/** Antes de jugar ya con bots: quién va (solo los del rancho con el nivel justo), con qué movimiento y qué suma a las pasivas */
export function IncursionPrep({ game, inc, onClose }: { game: GameState; inc: Incursion; onClose: () => void }) {
  const mons = byPickOrder(game, game.owned.filter((m) => monPlace(game, m.uid) === MonPlace.Ranch))
  const [uid, setUid] = useState(mons.find((m) => usable(inc, m))?.uid)
  const [moveId, setMoveId] = useState<string | null>(null)
  const mon = mons.find((m) => m.uid === uid)
  const moves = mon ? monRepertoire(mon) : []
  const move = moves.find((mv) => mv.id === moveId) ?? moves[0]
  const blocker = !mon || !move ? 'Ninguno de tus Pokémon del rancho tiene el nivel para entrar.' : incursionBlocker(game, inc.id, mon.uid, move.id)

  const enter = () => {
    if (!mon || !move) return
    act((s) => startIncursion(s, inc.id, mon.uid, move.id, Date.now()))
    onClose()
  }

  return (
    <Modal className="route-start" label={`Entrar en ${inc.name}`} onClose={onClose}>
      <HeroLayout compact scenery={BIOME_SCENERY[inc.biome]} name={inc.name} subtitle={`Nv. ${inc.minLevel}–${inc.maxLevel}`}>
        {mon && <Sprite key={mon.uid} id={mon.speciesId} size={96} className="mon-hero-sprite idle-bounce" shiny={mon.shiny} />}
      </HeroLayout>
      <div className="route-start-body">
        <div className="label">¿Quién va?</div>
        <MonPicker game={game} mons={mons} selectedUid={mon?.uid} onSelect={setUid} lockOf={(m) => (usable(inc, m) ? null : 'other')} />
        {mon && <PassiveShare mon={mon} />}
        {move && (
          <>
            <div className="label">Movimiento</div>
            <MovePicker moves={moves} selectedId={move.id} onSelect={setMoveId} />
          </>
        )}
        <p className="tiny muted">
          {needsKey(inc.id) ? `Llaves: ${keysOf(game, inc.id)}. Se gasta una al entrar: ` : `${entryNote(game, inc)} `}
          juegas al momento, con bots en el resto del grupo.
        </p>
        {blocker && <p className="notice small">{blocker}</p>}
        <div className="row gap confirm-actions">
          <button className="btn grow" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary grow" disabled={!!blocker} onClick={enter}>
            Entrar
          </button>
        </div>
      </div>
    </Modal>
  )
}

/** Aviso de una incursión gratuita: si aún da premios o ya no */
const entryNote = (game: GameState, inc: Incursion) =>
  freePrizeSpent(game, inc.id)
    ? 'Gratis, pero sus premios ya los cobraste: ahora es solo para practicar. Al entrar,'
    : 'Gratis: no pide llave, y sus premios solo se cobran la primera vez. Al entrar,'

/** Lo que aporta a las pasivas de grupo: el peso de su rareza en cada uno de sus tipos */
function PassiveShare({ mon }: { mon: OwnedMon }) {
  const sp = species(mon.speciesId)
  const weight = passiveWeightOf(sp.id)
  return (
    <p className="tiny center">
      Suma <strong>{weight}</strong> a las pasivas de {sp.types.map((t) => TYPE_INFO[t].name).join(' y ')}
    </p>
  )
}
