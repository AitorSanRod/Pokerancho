import { useState } from 'react'
import { createPortal } from 'react-dom'
import { RARITY_WEIGHT } from '../../data/incursionPassives'
import type { Incursion } from '../../data/incursions'
import { rarityOf, species } from '../../data/species'
import { TYPE_INFO } from '../../data/types'
import { MonPlace, monPlace, type GameState, type OwnedMon } from '../../game/core/state'
import { act } from '../../game/core/store'
import { canEnter } from '../../game/incursion/entry'
import { incursionBlocker } from '../../game/incursion/incursionGame'
import { keysOf } from '../../game/incursion/keys'
import { enterQueue } from '../../game/incursion/online/linkedIncursion'
import { repertoire } from '../../game/incursion/repertoire'
import { Sprite } from '../shared/common'
import { MonPicker } from '../shared/MonPicker'
import { HeroLayout } from '../shared/sheet/HeroLayout'
import { BIOME_SCENERY } from '../shared/sheet/scenery'
import { MovePicker } from './MovePicker'
import '../shared/overlays.css'
import '../route/route-start.css'

const usable = (inc: Incursion, m: OwnedMon) => canEnter(inc, m.level) && m.hp >= 1

/** Antes de entrar: quién va (solo los del rancho con el nivel justo), con qué movimiento y qué suma a las pasivas */
export function IncursionPrep({ game, inc, onClose }: { game: GameState; inc: Incursion; onClose: () => void }) {
  const mons = game.owned.filter((m) => monPlace(game, m.uid) === MonPlace.Ranch).sort((a, b) => b.level - a.level)
  const [uid, setUid] = useState(mons.find((m) => usable(inc, m))?.uid)
  const [moveId, setMoveId] = useState<string | null>(null)
  const mon = mons.find((m) => m.uid === uid)
  const moves = mon ? repertoire(mon.speciesId, mon.level) : []
  const move = moves.find((mv) => mv.id === moveId) ?? moves[0]
  const blocker = !mon || !move ? 'Ninguno de tus Pokémon del rancho tiene el nivel para entrar.' : incursionBlocker(game, inc.id, mon.uid, move.id)

  const enter = () => {
    if (!mon || !move) return
    act((s) => enterQueue(s, inc.id, mon.uid, move.id, Date.now()))
    onClose()
  }

  return createPortal(
    <div className="confirm-overlay" onClick={onClose}>
      <div className="card route-start" role="dialog" aria-modal="true" aria-label={`Entrar en ${inc.name}`} onClick={(e) => e.stopPropagation()}>
        <HeroLayout compact scenery={BIOME_SCENERY[inc.biome]} name={inc.name} subtitle={`Nv. ${inc.minLevel}–${inc.maxLevel}`}>
          {mon && <Sprite key={mon.uid} id={mon.speciesId} size={96} className="mon-hero-sprite idle-bounce" />}
        </HeroLayout>
        <div className="route-start-body">
          <div className="label">¿Quién va?</div>
          <MonPicker mons={mons} selectedUid={mon?.uid} onSelect={setUid} lockOf={(m) => (usable(inc, m) ? null : 'other')} />
          {mon && <PassiveShare mon={mon} />}
          {move && (
            <>
              <div className="label">Movimiento</div>
              <MovePicker moves={moves} selectedId={move.id} onSelect={setMoveId} />
            </>
          )}
          <p className="tiny muted">
            Llaves: {keysOf(game, inc.id)}. Se gasta una al formarse el grupo: se busca a otros entrenadores durante un minuto y, si no llegan a cinco, se completa con bots.
          </p>
          {blocker && <p className="notice small">{blocker}</p>}
          <div className="row gap confirm-actions">
            <button className="btn grow" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn primary grow" disabled={!!blocker} onClick={enter}>
              Buscar grupo
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Lo que aporta a las pasivas de grupo: el peso de su rareza en cada uno de sus tipos */
function PassiveShare({ mon }: { mon: OwnedMon }) {
  const sp = species(mon.speciesId)
  const weight = RARITY_WEIGHT[rarityOf(sp)]
  return (
    <p className="tiny center">
      Suma <strong>{weight}</strong> a las pasivas de {sp.types.map((t) => TYPE_INFO[t].name).join(' y ')}
    </p>
  )
}
