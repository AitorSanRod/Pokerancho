import { TYPE_INFO } from '../../data/types'
import type { TypeCollection } from '../../game/collection/typeCollection'
import { STAR_TYPE_BONUS_MAX } from '../../game/team/milestones'
import { formatBonus } from '../shared/format'
import { TypeBadge } from '../shared/common'

export interface PerkRowData extends TypeCollection {
  /** Bono de stats de los Pokémon de este tipo por sus especies con 5 ★ */
  stars: number
  /** Especies distintas de este tipo con 5 ★ */
  starCount: number
}

function collectionNote(r: PerkRowData): string {
  if (!r.next) return 'Colección completa'
  const species = r.toNext === 1 ? 'especie' : 'especies'
  return `Captura ${r.toNext} ${species} más para ${formatBonus(r.next.damage)}`
}

function starNote(r: PerkRowData): string {
  if (r.starCount === 0) return 'Ninguna especie de este tipo con 5 ★'
  const species = r.starCount === 1 ? 'especie' : 'especies'
  const capped = r.stars >= STAR_TYPE_BONUS_MAX - 1e-9 ? ' (tope)' : ''
  return `${r.starCount} ${species} con 5 ★${capped}`
}

function PerkLine({ label, value, note }: { label: string; value: string | null; note: string }) {
  return (
    <div className="dex-perk-line">
      <span className="grow">
        <span className="small">{label}</span>
        <span className="tiny muted">{note}</span>
      </span>
      <span className={`dex-perk-value ${value ? 'on' : ''}`}>{value ?? '—'}</span>
    </div>
  )
}

/** Un tipo: el daño de más de sus ataques (colección) y las stats de más de sus Pokémon (especies con 5 ★) */
export function DexPerkRow({ row: r }: { row: PerkRowData }) {
  const name = TYPE_INFO[r.type].name
  return (
    <div className="dex-perk-row" style={{ ['--type-color' as string]: TYPE_INFO[r.type].color }}>
      <div className="dex-perk-row-head">
        <TypeBadge type={r.type} />
        <span className="tiny muted">
          <strong>{r.caught}</strong>/{r.total} especies capturadas
        </span>
      </div>
      <PerkLine label={`Daño de los ataques ${name}`} value={r.damage > 0 ? formatBonus(r.damage) : null} note={collectionNote(r)} />
      <PerkLine label={`Stats de tus Pokémon ${name}`} value={r.stars > 0 ? formatBonus(r.stars) : null} note={starNote(r)} />
    </div>
  )
}
