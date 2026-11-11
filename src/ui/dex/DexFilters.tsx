import { DexFilter, DexSort, type DexQuery } from '../../game/collection/dexQuery'

const SORT_LABEL: Record<DexSort, string> = {
  [DexSort.Number]: 'Número',
  [DexSort.Owned]: 'Los que tienes',
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
}

interface Props {
  query: DexQuery
  onChange: (patch: Partial<DexQuery>) => void
}

/** Desplegables de orden y filtro de la Pokédex */
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
    </div>
  )
}
