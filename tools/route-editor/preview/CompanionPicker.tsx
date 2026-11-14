import { POKEMON } from '../../../src/data/pokemon'
import { MAX_LEVEL } from '../../../src/game/team/stats'
import { Sprite } from '../../../src/ui/shared/common'
import type { Companion } from './simulate'

const NAMES = Object.keys(POKEMON) as (keyof typeof POKEMON)[]

const nameOf = (id: number) => NAMES.find((k) => POKEMON[k] === id) ?? ''

export function CompanionPicker({ companion, onChange }: { companion: Companion; onChange: (c: Companion) => void }) {
  return (
    <div className="companion">
      <Sprite id={companion.speciesId} size={40} />
      <input
        list="preview-species"
        defaultValue={nameOf(companion.speciesId)}
        onChange={(e) => {
          const id = POKEMON[e.target.value as keyof typeof POKEMON]
          if (id) onChange({ ...companion, speciesId: id })
        }}
        aria-label="Tu Pokémon"
      />
      <label>
        Nv.
        <input
          type="number"
          min={1}
          max={MAX_LEVEL}
          value={companion.level}
          onChange={(e) => onChange({ ...companion, level: Math.min(MAX_LEVEL, Math.max(1, Number(e.target.value) || 1)) })}
        />
      </label>
      <datalist id="preview-species">
        {NAMES.map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>
    </div>
  )
}
