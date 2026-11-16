import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useBackToClose } from './useBackToClose'
import './overlays.css'

interface ModalProps {
  /** Clase de la tarjeta: `confirm-dialog` para las ventanas sencillas, `route-start` para las de paisaje… */
  className?: string
  /** Nombre del diálogo para los lectores de pantalla, si no lleva título visible */
  label?: string
  /** Tocar fuera, «Atrás» o Escape; sin él, la ventana no se cierra sola */
  onClose?: () => void
  children: ReactNode
}

/**
 * Ventana sobre fondo oscuro, la base de todos los diálogos. Se pinta en <body> para que no herede nada de donde se
 * use (p. ej. el panel de la ruta tiene pointer-events: none y la dejaría sin poder tocarse).
 */
export function Modal({ className = 'confirm-dialog', label, onClose, children }: ModalProps) {
  useBackToClose(onClose)
  return createPortal(
    <div className="confirm-overlay" onClick={onClose}>
      <div className={`card ${className}`} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
