import type { ReactNode } from 'react'
import './fold-section.css'

interface Props {
  title: string
  /** Resumen a la derecha del título, para saber qué hay dentro sin abrirla */
  aside?: ReactNode
  children: ReactNode
}

/** Sección de un panel que empieza plegada: solo se ve su título (y su resumen) hasta que se toca */
export function FoldSection({ title, aside, children }: Props) {
  return (
    <details className="fold-section">
      <summary className="fold-section-head">
        <span className="fold-section-title">{title}</span>
        {aside !== undefined && <span className="fold-section-aside small">{aside}</span>}
      </summary>
      <div className="fold-section-body">{children}</div>
    </details>
  )
}
