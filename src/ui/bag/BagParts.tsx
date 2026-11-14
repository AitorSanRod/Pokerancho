import type { ReactNode } from 'react'

/** Un grupo de la Mochila: título, dónde se usa y su cuadrícula */
export function BagGroup({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="bag-group">
      <h3 className="bag-group-title">{title}</h3>
      <p className="tiny muted">{hint}</p>
      <div className="bag-grid">{children}</div>
    </section>
  )
}

/** Una casilla de la Mochila: icono, cuántos hay y nombre; `action`, un botón debajo (p. ej. «Usar») */
export function BagTile({ icon, name, count, action }: { icon: ReactNode; name: string; count: number; action?: ReactNode }) {
  return (
    <div className="bag-tile">
      <span className="bag-tile-icon">
        {icon}
        {count > 0 && <span className="bag-tile-count">×{count}</span>}
      </span>
      <span className="tiny">{name}</span>
      {action}
    </div>
  )
}
