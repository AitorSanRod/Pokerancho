import { TYPE_INFO, type PokeType } from '../../data/types'
import { DexFilter, DexSort, TYPES_BY_NAME, type DexQuery } from '../../game/collection/dexQuery'
import './dex-toolbar.css'

const SORT_LABEL: Record<DexSort, string> = {
  [DexSort.Number]: 'Número',
  [DexSort.Owned]: 'Los que tienes',
  [DexSort.Level]: 'Nivel (solo los tuyos)',
  [DexSort.Tickets]: 'Más tickets',
  [DexSort.Rarity]: 'Rareza',
  [DexSort.Name]: 'Nombre',
}

const FILTER_LABEL: Record<DexFilter, string> = {
  [DexFilter.All]: 'Todos',
  [DexFilter.Owned]: 'Los que tienes',
  [DexFilter.Missing]: 'Los que faltan',
  [DexFilter.Tickets]: 'Con tickets',
  [DexFilter.Ready]: 'Listos para combinar',
  [DexFilter.Favorites]: 'Favoritos',
  [DexFilter.Type]: 'Tipo',
}

const ALL_TYPES = 'all'

interface Props {
  query: DexQuery
  onChange: (patch: Partial<DexQuery>) => void
}

/** Desplegables de orden y filtro de la Pokédex; con el filtro de tipo, también la lista de tipos */
export function DexFilters({ query, onChange }: Props) {
  return (
    <div className="dex-selects">
      <label className="dex-select">
        <span className="tiny muted">Ordenar</span>
        <select value={query.sort} onChange={(e) => onChange({ sort: e.target.value as DexSort })}>
          {Object.values(DexSort).map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABEL[sort]}
            </option>
          ))}
        </select>
      </label>
      <label className="dex-select">
        <span className="tiny muted">Mostrar</span>
        <select value={query.filter} onChange={(e) => onChange({ filter: e.target.value as DexFilter })}>
          {Object.values(DexFilter).map((filter) => (
            <option key={filter} value={filter}>
              {FILTER_LABEL[filter]}
            </option>
          ))}
        </select>
      </label>
      {query.filter === DexFilter.Type && (
        <label className="dex-select">
          <span className="tiny muted">Tipo</span>
          <select
            value={query.type ?? ALL_TYPES}
            onChange={(e) => onChange({ type: e.target.value === ALL_TYPES ? null : (e.target.value as PokeType) })}
          >
            <option value={ALL_TYPES}>Todos</option>
            {TYPES_BY_NAME.map((type) => (
              <option key={type} value={type}>
                {TYPE_INFO[type].name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
