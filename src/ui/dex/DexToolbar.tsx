import { useState, type ReactNode } from 'react'
import { DEFAULT_DEX_QUERY, DexFilter, DexSort, plainText, type DexQuery } from '../../game/collection/dexQuery'
import { DexFilters } from './DexFilters'

const Panel = { Search: 'search', Filters: 'filters' } as const
type Panel = (typeof Panel)[keyof typeof Panel]

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 21 21" />
  </svg>
)

const FiltersIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
)

interface Props {
  query: DexQuery
  onChange: (query: DexQuery) => void
}

/** Botones de buscar y de ordenar y filtrar de la Pokédex: cada uno despliega su panel */
export function DexToolbar({ query, onChange }: Props) {
  const [open, setOpen] = useState<Panel | null>(null)
  const set = (patch: Partial<DexQuery>) => onChange({ ...query, ...patch })
  const searching = plainText(query.text) !== ''
  const filtered = query.sort !== DexSort.Number || query.filter !== DexFilter.All
  const toggle = (panel: Panel) => setOpen(open === panel ? null : panel)
  const clear = () => (onChange(DEFAULT_DEX_QUERY), setOpen(null))

  const button = (panel: Panel, label: string, icon: ReactNode, active: boolean) => (
    <button
      className={`dex-tool ${open === panel ? 'open' : ''} ${active ? 'active' : ''}`}
      aria-expanded={open === panel}
      onClick={() => toggle(panel)}
    >
      {icon}
      <span>{label}</span>
    </button>
  )

  return (
    <div className="dex-toolbar">
      <div className="dex-tools">
        {button(Panel.Search, 'Buscar', <SearchIcon />, searching)}
        {button(Panel.Filters, 'Ordenar y filtrar', <FiltersIcon />, filtered)}
        {(searching || filtered) && (
          <button className="dex-filter-clear" onClick={clear} aria-label="Quitar búsqueda y filtros">
            ✕
          </button>
        )}
      </div>
      {open === Panel.Search && (
        <input
          className="text-input dex-search"
          type="search"
          value={query.text}
          placeholder="Nombre o número"
          aria-label="Buscar en la Pokédex"
          autoFocus
          onChange={(e) => set({ text: e.target.value })}
        />
      )}
      {open === Panel.Filters && <DexFilters query={query} onChange={set} />}
    </div>
  )
}
