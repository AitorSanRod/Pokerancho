import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { act } from '../../store/store'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { useCorrectionGuard } from '../trade/correctionGuard'
import { CountInput } from '../trade/CountInput'
import { formatMoney } from '../shared/format'

/** Una venta por cantidad (tickets de una especie o trozos) */
export interface CountSale {
  /** Qué se vende, en minúscula y plural: «tickets de Pikachu» */
  name: string
  /** ₽ por cada uno */
  price: number
  max: number
  /** Vende `count` en la partida y devuelve los ₽ cobrados */
  sell: (s: GameState, count: number) => number
}

/** Elegir cuántos se venden y confirmar, con el total */
export function SellCountDialog({ sale, onClose }: { sale: CountSale; onClose: () => void }) {
  const [count, setCount] = useState(1)
  const [invalid, setInvalid] = useState(false)
  const correction = useCorrectionGuard()

  return (
    <ConfirmDialog
      title={`Vender ${sale.name}`}
      confirmLabel={`Vender por ${formatMoney(count * sale.price)}`}
      onConfirm={correction.guard(() => (act((s) => sale.sell(s, count)), onClose()))}
      confirmDisabled={invalid}
      onCancel={onClose}
    >
      <CountInput label="Cuántos" value={count} max={sale.max} onChange={setCount} onInvalid={setInvalid} onCorrected={correction.onCorrected} />
    </ConfirmDialog>
  )
}
