import { COLLECTION_TIERS } from '../../game/collection/typeCollection'
import { LEVEL_MILESTONES, MILESTONE_STAT_BONUS, STAR_TYPE_BONUS, STAR_TYPE_BONUS_MAX } from '../../game/team/milestones'
import { formatBonus } from '../shared/format'

interface Rule {
  title: string
  gives: string
  who: string
  how: string
}

const percent = (share: number) => `${Math.round(share * 100)} %`

const RULES: Rule[] = [
  {
    title: 'Colección por tipo',
    gives: 'Más daño',
    who: 'Los ataques de ese tipo, los use el Pokémon que sea. Un ataque de Fuego pega más aunque lo lance un Pokémon de Agua.',
    how: `Captura especies del tipo: ${COLLECTION_TIERS.map((t) => `${percent(t.share)} de ellas → ${formatBonus(t.damage)}`).join(' · ')}.`,
  },
  {
    title: 'Especies con 5 ★',
    gives: 'Más stats',
    who: 'Todos tus Pokémon de ese tipo. Si un Pokémon tiene dos tipos, suma el bono de los dos.',
    how: `Cada especie distinta que tengas con 5 ★ da ${formatBonus(STAR_TYPE_BONUS)} a todas las stats, hasta ${formatBonus(STAR_TYPE_BONUS_MAX)} por tipo.`,
  },
  {
    title: 'Hitos de nivel',
    gives: 'Más stats',
    who: 'Solo al Pokémon que sube de nivel; no depende del tipo.',
    how: `${formatBonus(MILESTONE_STAT_BONUS)} a todas sus stats al llegar a ${LEVEL_MILESTONES.map((l) => `Nv. ${l}`).join(', ')}. Se ven en su ficha, en Datos.`,
  },
]

/** Las tres mejoras explicadas: qué dan, a quién afectan y cómo se consiguen */
export function DexPerkRules() {
  return (
    <div className="dex-perk-rules">
      {RULES.map((r) => (
        <div key={r.title} className="dex-perk-rule">
          <div className="dex-perk-rule-head">
            <strong>{r.title}</strong>
            <span className="dex-perk-gives">{r.gives}</span>
          </div>
          <p className="small">
            <span className="muted">A quién: </span>
            {r.who}
          </p>
          <p className="small">
            <span className="muted">Cómo: </span>
            {r.how}
          </p>
        </div>
      ))}
    </div>
  )
}
