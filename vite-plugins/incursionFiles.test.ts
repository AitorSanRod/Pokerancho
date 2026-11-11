import { describe, expect, it } from 'vitest'
import { addIncursionId, addToIncursionList, hasIncursionId, parseWrite } from './incursionFiles.ts'

const TYPES = `/** Id */\nexport const IncursionId = { Uno: 'uno', DosTres: 'dos-tres' } as const\nexport type IncursionId = 1\n`
const INDEX = `import { UNO } from './uno'\nimport { DOS_TRES } from './dosTres'\nimport type { Incursion } from './types'\n\nexport const INCURSIONS: Incursion[] = [UNO, DOS_TRES]\n`
const WRITE = { idKey: 'Nueva', idValue: 'nueva', constName: 'NUEVA', fileName: 'nueva', code: 'export const NUEVA = {}' }

describe('dar de alta una incursión', () => {
  it('sabe qué claves hay ya en IncursionId', () => {
    expect(hasIncursionId(TYPES, 'DosTres')).toBe(true)
    expect(hasIncursionId(TYPES, 'Tres')).toBe(false)
  })

  it('añade la clave al final de IncursionId', () => {
    const out = addIncursionId(TYPES, 'Nueva', 'nueva')
    expect(out).toContain(`{ Uno: 'uno', DosTres: 'dos-tres', Nueva: 'nueva' } as const`)
    expect(hasIncursionId(out, 'Nueva')).toBe(true)
  })

  it('no repite un valor que ya se usa', () => {
    expect(() => addIncursionId(TYPES, 'Otra', 'uno')).toThrow()
  })

  it('importa la incursión tras las demás y la pone al final de la lista', () => {
    const out = addToIncursionList(INDEX, 'NUEVA', 'nueva')
    expect(out).toContain(`import { DOS_TRES } from './dosTres'\nimport { NUEVA } from './nueva'\nimport type`)
    expect(out).toContain('= [UNO, DOS_TRES, NUEVA]')
  })

  it('también con saltos de línea de Windows', () => {
    const out = addToIncursionList(INDEX.replace(/\n/g, '\r\n'), 'NUEVA', 'nueva')
    expect(out).toContain(`from './dosTres'\nimport { NUEVA } from './nueva'\r\n`)
  })

  it('rechaza nombres de fichero o ids mal formados', () => {
    expect(parseWrite(WRITE)).toEqual(WRITE)
    expect(() => parseWrite({ ...WRITE, fileName: '../../evil' })).toThrow()
    expect(() => parseWrite({ ...WRITE, idKey: 'minúscula' })).toThrow()
    expect(() => parseWrite({ ...WRITE, code: ' ' })).toThrow()
  })
})
