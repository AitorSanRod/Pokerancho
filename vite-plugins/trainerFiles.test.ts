import { describe, expect, it } from 'vitest'
import { addTrainerId, hasTrainerId, parseTrainerWrite, upsertTrainer } from './trainerFiles.ts'

// Como en trainers.ts: el diccionario con una clave por línea y alguna entrada con un comentario encima
const FILE = `export const TrainerId = {
  Uno: 'uno',
} as const
export type TrainerId = (typeof TrainerId)[keyof typeof TrainerId]

export const TRAINERS: Record<TrainerId, Trainer> = {
  // Comentario de la entrada
  [TrainerId.Uno]: {
    name: 'Viejo',
    team: [
      {
        speciesId: 1,
        level: 5,
      },
    ],
  },
}
`

const entry = (key: string, name: string) => `  [TrainerId.${key}]: {\n    name: '${name}',\n    team: [],\n  },`

describe('guardar un entrenador desde el editor', () => {
  it('sustituye la entrada de uno que ya está, con su comentario y sin tocar lo demás', () => {
    const out = upsertTrainer(FILE, 'Uno', entry('Uno', 'Nuevo'))
    expect(out).toContain("name: 'Nuevo'")
    expect(out).not.toContain("name: 'Viejo'")
    expect(out).toContain('// Comentario de la entrada')
    expect(out.match(/\[TrainerId\.Uno\]/g)).toHaveLength(1)
    expect(out.endsWith('}\n')).toBe(true)
  })

  it('uno nuevo va al final de TRAINERS y su clave a TrainerId, en una línea propia', () => {
    expect(hasTrainerId(FILE, 'Dos')).toBe(false)
    const out = upsertTrainer(addTrainerId(FILE, 'Dos', 'dos'), 'Dos', entry('Dos', 'Otro'))
    expect(hasTrainerId(out, 'Dos')).toBe(true)
    expect(out).toContain("TrainerId = {\n  Uno: 'uno',\n  Dos: 'dos',\n} as const")
    expect(out.indexOf('[TrainerId.Dos]')).toBeGreaterThan(out.indexOf('[TrainerId.Uno]'))
  })

  it('rechaza ids mal formados, un valor repetido o un código de otro entrenador', () => {
    expect(() => parseTrainerWrite({ idKey: 'uno', idValue: 'uno', code: entry('uno', 'x') })).toThrow()
    expect(() => parseTrainerWrite({ idKey: 'Uno', idValue: 'uno', code: entry('Dos', 'x') })).toThrow()
    expect(() => addTrainerId(FILE, 'Otro', 'uno')).toThrow()
    expect(parseTrainerWrite({ idKey: 'Uno', idValue: 'uno', code: entry('Uno', 'x') }).idKey).toBe('Uno')
  })
})
