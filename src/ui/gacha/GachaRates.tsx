import { RARITY_INFO } from '../../data/species'
import { STAR_ITEM_IDS, STAR_ITEMS, type StarItem } from '../../data/starItems'
import { Foldout } from '../shared/Foldout'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RARITIES, RARITY_TITLE } from './rarityTitles'

/** «0,25 %»: las probabilidades de los objetos son pequeñas y necesitan decimales */
const percent = (chance: number) => `${(chance * 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })} %`

/** Probabilidad de cada rareza por ticket y de cada objeto estelar por tirada, en un desplegable cerrado bajo la máquina */
export function GachaRates() {
  return (
    <Foldout
      kicker="Gacha"
      title="Probabilidades"
      className="gacha-rates-fold"
      art={<ItemIcon item={ICON.Gacha} size={110} className="foldout-art" />}
      defaultOpen={false}
    >
      <div className="gacha-rates">
        {RARITIES.map((r) => (
          <div key={r} className="card gacha-rate" style={{ ['--rarity' as string]: RARITY_INFO[r].color }}>
            <strong>{(RARITY_INFO[r].rate * 100).toFixed(0)}%</strong>
            <span className="small">{RARITY_TITLE[r]}</span>
          </div>
        ))}
      </div>
      <p className="tiny muted">Objetos estelares, por tirada (se gastan al crear o evolucionar un Pokémon raro, épico o legendario):</p>
      <div className="gacha-rates gacha-item-rates">
        {[...STAR_ITEM_IDS].reverse().map((id) => (
          <StarItemRate key={id} id={id} />
        ))}
      </div>
    </Foldout>
  )
}

function StarItemRate({ id }: { id: StarItem }) {
  const info = STAR_ITEMS[id]
  return (
    <div className="card gacha-rate" style={{ ['--rarity' as string]: RARITY_INFO[info.rarity].color }}>
      <ItemIcon item={info.item} size={32} />
      <strong>{percent(info.gachaChance)}</strong>
      <span className="small">{info.name}</span>
    </div>
  )
}
