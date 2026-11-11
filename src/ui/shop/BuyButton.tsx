import { useState, type ReactNode } from 'react'
import { ConfirmDialog } from '../shared/ConfirmDialog'

interface Props {
  /** Nombre del artículo, tal como sale en la casilla */
  name: string
  /** Icono del artículo, repetido en la confirmación */
  icon: ReactNode
  price: number
  /** Dinero del jugador, para decirle cuánto le quedará */
  money: number
  disabled?: boolean
  /** Por qué no se puede comprar (al mantener el dedo o el ratón encima) */
  title?: string
  onBuy: () => void
}

const formatPrice = (n: number) => `₽ ${n.toLocaleString('es-ES')}`

/** Botón de precio de la Tienda: pide confirmación antes de comprar, para que nadie compre sin querer ni dude de si compró */
export function BuyButton({ name, icon, price, money, disabled = false, title, onBuy }: Props) {
  const [confirming, setConfirming] = useState(false)
  const buy = () => {
    onBuy()
    setConfirming(false)
  }

  return (
    <>
      <button className="btn primary small" disabled={disabled} title={title} onClick={() => setConfirming(true)}>
        {formatPrice(price)}
      </button>
      {confirming && (
        <ConfirmDialog title={`¿Comprar ${name}?`} confirmLabel={`Comprar por ${formatPrice(price)}`} onConfirm={buy} onCancel={() => setConfirming(false)}>
          <div className="row gap buy-confirm">
            {icon}
            <p className="small confirm-text">
              Pagarás {formatPrice(price)} y te quedarán {formatPrice(money - price)}.
            </p>
          </div>
        </ConfirmDialog>
      )}
    </>
  )
}
