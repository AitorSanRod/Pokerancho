import { describe, expect, it } from 'vitest'
import { MAX_ERROR_MESSAGE, MAX_ERROR_STACK, parseErrorReport } from './errorReport'

describe('informe de error', () => {
  it('acepta mensaje, pila y componente', () => {
    expect(parseErrorReport({ message: ' Falló ', stack: 'at a', component: 'at RunView' })).toEqual({ message: 'Falló', stack: 'at a', component: 'at RunView' })
  })

  it('recorta lo que es demasiado largo', () => {
    const r = parseErrorReport({ message: 'm'.repeat(MAX_ERROR_MESSAGE + 10), stack: 's'.repeat(MAX_ERROR_STACK + 10) })!
    expect(r.message).toHaveLength(MAX_ERROR_MESSAGE)
    expect(r.stack).toHaveLength(MAX_ERROR_STACK)
  })

  it('ignora lo que no es texto y rechaza un informe vacío', () => {
    expect(parseErrorReport({ message: 'x', stack: 3, component: {} })).toEqual({ message: 'x', stack: '', component: '' })
    expect(parseErrorReport({ message: '  ', stack: '' })).toBeNull()
    expect(parseErrorReport(null)).toBeNull()
    expect(parseErrorReport('texto')).toBeNull()
  })
})
