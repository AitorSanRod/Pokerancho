import type { ReactNode } from 'react'
import './incursion-fold.css'

/** Sección plegada bajo la escena: solo se ve su título hasta que se toca */
export function Fold({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <details className="incursion-fold">
      <summary className="incursion-fold-title">{title}</summary>
      <div className="incursion-fold-body">{children}</div>
    </details>
  )
}
