import { describe, expect, it } from 'vitest'
import { addGymId, hasGymId, parseGymWrite, upsertGym } from './gymFiles.ts'

const FILE = `export const GymId = { Uno: 'uno' } as const
export type GymId = (typeof GymId)[keyof typeof GymId]

export const GYMS: Record<GymId, Gym> = {
  [GymId.Uno]: {
    leader: 'Viejo',
    team: [
      { speciesId: 1, level: 5 },
    ],
  },
}
`

const entry = (key: string, leader: string) => `  [GymId.${key}]: {\n    leader: '${leader}',\n    team: [],\n  },`

describe('guardar un gimnasio desde el editor', () => {
  it('sustituye la entrada de un gimnasio que ya está, sin tocar lo demás', () => {
    const out = upsertGym(FILE, 'Uno', entry('Uno', 'Nuevo'))
    expect(out).toContain("leader: 'Nuevo'")
    expect(out).not.toContain("leader: 'Viejo'")
    expect(out.match(/\[GymId\.Uno\]/g)).toHaveLength(1)
    expect(out.endsWith('}\n')).toBe(true)
  })

  it('uno nuevo va al final de GYMS y su clave a GymId', () => {
    expect(hasGymId(FILE, 'Dos')).toBe(false)
    const out = upsertGym(addGymId(FILE, 'Dos', 'dos'), 'Dos', entry('Dos', 'Otra'))
    expect(hasGymId(out, 'Dos')).toBe(true)
    expect(out).toContain("GymId = { Uno: 'uno', Dos: 'dos' } as const")
    expect(out.indexOf('[GymId.Dos]')).toBeGreaterThan(out.indexOf('[GymId.Uno]'))
  })

  it('también con saltos de línea de Windows', () => {
    expect(upsertGym(FILE.replace(/\n/g, '\r\n'), 'Uno', entry('Uno', 'Nuevo'))).toContain("leader: 'Nuevo'")
  })

  it('rechaza ids mal formados, un valor repetido o un código de otro gimnasio', () => {
    expect(() => parseGymWrite({ idKey: 'uno', idValue: 'uno', code: entry('uno', 'x') })).toThrow()
    expect(() => parseGymWrite({ idKey: 'Uno', idValue: 'uno', code: entry('Dos', 'x') })).toThrow()
    expect(() => addGymId(FILE, 'Otro', 'uno')).toThrow()
    expect(parseGymWrite({ idKey: 'Uno', idValue: 'uno', code: entry('Uno', 'x') }).idKey).toBe('Uno')
  })
})
