import { FORM_ITEMS, type FormItem } from '../../../data/forms'
import { species } from '../../../data/species'
import type { GameState, OwnedMon } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { changeForm, changeFormBlocker, formChoices, hasFormItem } from '../../../game/team/forms'
import { Sprite } from '../common'
import { MonSection } from './MonSheet'

/** Cambio de forma (Rotom): una fila por forma, gratis y sin confirmar porque se puede deshacer. No se pinta si no tiene formas */
export function FormPanel({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const choices = formChoices(mon.speciesId)
  if (choices.length === 0) return null
  return (
    <MonSection title="Forma">
      <div className="evolve-options">
        {choices.map((c) => (
          <FormOption key={c.speciesId} game={game} mon={mon} intoId={c.speciesId} item={c.item} />
        ))}
      </div>
    </MonSection>
  )
}

function FormOption({ game, mon, intoId, item }: { game: GameState; mon: OwnedMon; intoId: number; item: FormItem | null }) {
  const current = mon.speciesId === intoId
  const blocker = current ? null : changeFormBlocker(game, mon.uid, intoId)
  const missing = item !== null && !hasFormItem(game, item)
  return (
    <div className="evolve-option">
      <button className="btn big-action" disabled={current || !!blocker} onClick={() => act((s) => changeForm(s, mon.uid, intoId))}>
        <Sprite id={intoId} animated={false} size={40} silhouette={missing} />
        <span className="grow">
          {species(intoId).name}
          <span className="tiny muted evolve-requirement">{item ? FORM_ITEMS[item].name : 'Forma normal'}</span>
        </span>
        {current && <span className="tag ok">Actual</span>}
      </button>
      {blocker && <p className="tiny muted">{missing ? `${blocker} Está en Tienda › Formas de Rotom.` : blocker}</p>}
    </div>
  )
}
