import type { ReactNode } from 'react'
import { Modal } from './Modal'

/** Ventana de confirmación con Cancelar y aceptar; tocar fuera, «Atrás» o Escape equivalen a cancelar */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  confirmDisabled = false,
  extraAction,
  onConfirm,
  onCancel,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  /** Texto del botón de no hacer nada; cambiarlo cuando la propia acción sea «cancelar» algo */
  cancelLabel?: string
  /** Sin poder aceptar aún (falta elegir algo o se está esperando al servidor) */
  confirmDisabled?: boolean
  /** Otra acción, a lo ancho encima de Cancelar y aceptar (p. ej. «Reiniciar ruta» al abandonar) */
  extraAction?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal onClose={onCancel}>
      <h3>{title}</h3>
      {children}
      {extraAction && <div className="confirm-actions confirm-extra">{extraAction}</div>}
      <div className="row gap confirm-actions">
        <button className="btn grow" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className="btn primary grow" disabled={confirmDisabled} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
