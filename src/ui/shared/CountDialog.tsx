import { useState, type ReactNode } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { useCorrectionGuard } from './correctionGuard'
import { CountInput } from './CountInput'

/**
 * Elegir cuántos (de 1 a `max`) y confirmar: vender tickets o trozos, triturar tickets… El botón dice lo que se gana con
 * esa cantidad; `warning` va encima del campo (p. ej. que es un favorito)
 */
export function CountDialog({
  title,
  max,
  confirmLabel,
  warning,
  onConfirm,
  onClose,
}: {
  title: string
  max: number
  confirmLabel: (count: number) => string
  warning?: ReactNode
  onConfirm: (count: number) => void
  onClose: () => void
}) {
  const [count, setCount] = useState(1)
  const [invalid, setInvalid] = useState(false)
  const correction = useCorrectionGuard()

  return (
    <ConfirmDialog
      title={title}
      confirmLabel={confirmLabel(count)}
      onConfirm={correction.guard(() => (onConfirm(count), onClose()))}
      confirmDisabled={invalid}
      onCancel={onClose}
    >
      {warning}
      <CountInput label="Cuántos" value={count} max={max} onChange={setCount} onInvalid={setInvalid} onCorrected={correction.onCorrected} />
    </ConfirmDialog>
  )
}
