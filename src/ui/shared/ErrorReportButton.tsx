import { useState } from 'react'
import { parseErrorReport } from '../../game/core/errorReport'
import { sendErrorReport } from '../../net/errorReport'

const SendState = { Idle: 'idle', Sending: 'sending', Sent: 'sent', Failed: 'failed' } as const
type SendState = (typeof SendState)[keyof typeof SendState]

const LABEL: Record<SendState, string> = {
  [SendState.Idle]: 'Enviar error',
  [SendState.Sending]: 'Enviando…',
  [SendState.Sent]: 'Enviado, ¡gracias!',
  [SendState.Failed]: 'No se pudo enviar: reintentar',
}

/** Botón de la pantalla «Algo ha fallado»: manda el error al servidor para que se pueda leer y arreglar */
export function ErrorReportButton({ error, component }: { error: Error; component: string }) {
  const [state, setState] = useState<SendState>(SendState.Idle)
  const send = async () => {
    const report = parseErrorReport({ message: error.message, stack: error.stack, component })
    if (!report) return setState(SendState.Failed)
    setState(SendState.Sending)
    setState((await sendErrorReport(report)) ? SendState.Sent : SendState.Failed)
  }
  return (
    <button className="btn go" disabled={state === SendState.Sending || state === SendState.Sent} onClick={() => void send()}>
      {LABEL[state]}
    </button>
  )
}
