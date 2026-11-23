import type { Item } from '../../data/items'
import { ItemIcon } from './ItemIcon'
import './icon-tabs.css'

export interface IconTab<T extends string> {
  id: T
  icon: Item
  label: string
  /** Contador rojo sobre el icono; 0 o sin él, no se pinta */
  count?: number
  /** Hay algo en marcha en ella (ruta, subida, incursión, sala): punto verde que late, si no hay contador */
  live?: boolean
}

/** Pestañas de arriba de una pantalla: icono y nombre debajo; la activa, resaltada */
export function IconTabs<T extends string>({ tabs, active, onChange }: { tabs: IconTab<T>[]; active: T; onChange: (id: T) => void }) {
  return (
    <div className="segmented icon-tabs tabbed-bar" role="tablist">
      {tabs.map(({ id, icon, label, count = 0, live = false }) => (
        <button key={id} className={active === id ? 'active' : ''} onClick={() => onChange(id)} role="tab" aria-label={label} aria-selected={active === id}>
          <span className="icon-tab-icon">
            <ItemIcon item={icon} size={24} />
            {count > 0 ? <span className="count-badge">{count}</span> : live && <span className="live-dot" aria-hidden />}
          </span>
          <span className="icon-tab-label">{label}</span>
        </button>
      ))}
    </div>
  )
}
