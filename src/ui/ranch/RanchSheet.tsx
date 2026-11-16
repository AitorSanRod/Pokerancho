import type { ReactNode } from 'react'
import { useBackToClose } from '../shared/useBackToClose'
import './ranch.css'

interface RanchSheetProps {
  label?: string
  /** El botón de abajo y tocar fuera */
  onClose: () => void
  /** «Atrás» y Escape, si hacen otra cosa que cerrar (p. ej. volver al Menú desde uno de sus paneles) */
  onBack?: () => void
  /** Paso en el que está, si «Atrás» va de uno a otro antes de cerrar (ver useBackToClose) */
  step?: string
  closeLabel?: string
  children: ReactNode
}

/** Panel que sube desde abajo en el rancho (Menú, Caja, el rancho): el botón de cerrar, fijo abajo aunque haya scroll */
export function RanchSheet({ label, onClose, onBack = onClose, step, closeLabel = 'Cerrar', children }: RanchSheetProps) {
  useBackToClose(onBack, step)
  return (
    <div className="ranch-sheet-backdrop" onClick={onClose}>
      <div className="ranch-sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
        <div className="ranch-sheet-footer">
          <button className="btn wide" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
