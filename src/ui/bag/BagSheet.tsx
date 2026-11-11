import type { ReactNode } from 'react'
import { FORM_ITEMS } from '../../data/forms'
import { incursion } from '../../data/incursions'
import { RANCH_TYPES } from '../../data/ranchTypes'
import { STAR_ITEMS } from '../../data/starItems'
import { STONES } from '../../data/stones'
import { tmName, TMS } from '../../data/tms'
import type { GameState } from '../../game/core/state'
import { bagContents, isBagEmpty } from '../../game/team/bag'
import { MenuSheetHeader } from '../ranch/MenuSheetHeader'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RanchTypeGems } from '../shop/RanchTypeShop'
import './bag.css'

/** Mochila (menú del rancho): lo comprado o ganado y aún sin usar, con dónde se usa cada cosa */
export function BagSheet({ game, onBack }: { game: GameState; onBack: () => void }) {
  const bag = bagContents(game)
  return (
    <>
      <MenuSheetHeader icon={ICON.Bag} title="Mochila" onBack={onBack} />
      {isBagEmpty(bag) ? (
        <p className="notice small">La mochila está vacía. Lo que compres en la Tienda o ganes y aún no hayas usado aparecerá aquí.</p>
      ) : (
        <>
          {bag.starItems.length > 0 && (
            <BagGroup title="Objetos estelares" hint="Se gastan al crear o evolucionar a un Pokémon raro, épico o legendario.">
              {bag.starItems.map(({ id, count }) => (
                <BagTile key={id} icon={<ItemIcon item={STAR_ITEMS[id].item} size={44} />} name={STAR_ITEMS[id].name} count={count} />
              ))}
            </BagGroup>
          )}
          {bag.stones.length > 0 && (
            <BagGroup title="Objetos evolutivos" hint="Se usan en la ficha del Pokémon, en Evolución.">
              {bag.stones.map(({ id, count }) => (
                <BagTile key={id} icon={<ItemIcon item={STONES[id].item} size={44} />} name={STONES[id].name} count={count} />
              ))}
            </BagGroup>
          )}
          {bag.formItems.length > 0 && (
            <BagGroup title="Objetos de forma" hint="No se gastan: Rotom cambia de forma en su ficha, en Forma, siempre que quieras.">
              {bag.formItems.map(({ id, count }) => (
                <BagTile key={id} icon={<Sprite id={FORM_ITEMS[id].formId} animated={false} size={44} />} name={FORM_ITEMS[id].name} count={count} />
              ))}
            </BagGroup>
          )}
          {bag.mints > 0 && (
            <BagGroup title="Mentas" hint="Se gasta al usarla en la ficha de un Pokémon, en Naturaleza: le da otra naturaleza al azar.">
              <BagTile icon={<ItemIcon item={ICON.Mint} size={44} />} name="Menta aleatoria" count={bag.mints} />
            </BagGroup>
          )}
          {bag.ranchTypes.length > 0 && (
            <BagGroup title="Tipos de rancho" hint="Se colocan desde el botón de arriba a la izquierda del rancho.">
              {bag.ranchTypes.map(({ id, count }) => (
                <BagTile key={id} icon={<RanchTypeGems types={RANCH_TYPES[id].favors} />} name={`Rancho ${RANCH_TYPES[id].name}`} count={count} />
              ))}
            </BagGroup>
          )}
          {bag.tms.length > 0 && (
            <BagGroup title="MT" hint="Se gasta al enseñar su ataque, en la ficha de un Pokémon que pueda aprenderla. Solo se consiguen en incursiones o intercambiando.">
              {bag.tms.map(({ id, count }) => (
                <BagTile key={id} icon={<ItemIcon item={TMS[id].item} size={44} />} name={tmName(id)} count={count} />
              ))}
            </BagGroup>
          )}
          {bag.incursionKeys.length > 0 && (
            <BagGroup title="Llaves de incursión" hint="Se gasta una al entrar en su incursión, en Ruta › Incursiones.">
              {bag.incursionKeys.map(({ id, count }) => (
                <BagTile key={id} icon={<ItemIcon item={ICON.Incursion} size={44} />} name={incursion(id).name} count={count} />
              ))}
            </BagGroup>
          )}
        </>
      )}
    </>
  )
}

function BagGroup({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="bag-group">
      <h3 className="bag-group-title">{title}</h3>
      <p className="tiny muted">{hint}</p>
      <div className="bag-grid">{children}</div>
    </section>
  )
}

function BagTile({ icon, name, count }: { icon: ReactNode; name: string; count: number }) {
  return (
    <div className="bag-tile">
      <span className="bag-tile-icon">
        {icon}
        <span className="bag-tile-count">×{count}</span>
      </span>
      <span className="tiny">{name}</span>
    </div>
  )
}
