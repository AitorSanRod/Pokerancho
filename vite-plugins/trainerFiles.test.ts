import { describe, expect, it } from 'vitest'
import { hasTrainer, parseTrainerWrite, upsertTrainer } from './trainerFiles.ts'

// Como en trainers.ts: la lista con una entrada por clave y alguna con un comentario encima
const FILE = `const trainerList = <K extends string>(list: Record<K, Trainer>) => list

export const TRAINERS = trainerList({
  // Comentario de la entrada
  Uno: {
    trainerClass: TrainerClass.Hiker,
    team: [
      {
        speciesId: 1,
        level: 5,
      },
    ],
  },
})

export type TrainerId = keyof typeof TRAINERS
`

const entry = (key: string, level: number) => `  ${key}: {\n    trainerClass: TrainerClass.Hiker,\n    team: [{ speciesId: 1, level: ${level} }],\n  },`

describe('guardar un entrenador desde el editor', () => {
  it('sustituye la entrada de uno que ya está, con su comentario y sin tocar lo demás', () => {
    const out = upsertTrainer(FILE, 'Uno', entry('Uno', 9))
    expect(out).toContain('level: 9 }')
    expect(out).not.toContain('level: 5,')
    expect(out).toContain('// Comentario de la entrada')
    expect(out.match(/ {2}Uno: \{/g)).toHaveLength(1)
    expect(out).toContain('export type TrainerId = keyof typeof TRAINERS')
  })

  it('uno nuevo va al final de TRAINERS', () => {
    expect(hasTrainer(FILE, 'Uno')).toBe(true)
    expect(hasTrainer(FILE, 'Dos')).toBe(false)
    const out = upsertTrainer(FILE, 'Dos', entry('Dos', 7))
    expect(hasTrainer(out, 'Dos')).toBe(true)
    expect(out.indexOf('  Dos: {')).toBeGreaterThan(out.indexOf('  Uno: {'))
    expect(out.indexOf('  Dos: {')).toBeLessThan(out.indexOf('\n})\n'))
  })

  it('rechaza claves mal formadas o el código de otro entrenador', () => {
    expect(() => parseTrainerWrite({ idKey: 'uno', code: entry('uno', 1) })).toThrow()
    expect(() => parseTrainerWrite({ idKey: 'Uno', code: entry('Dos', 1) })).toThrow()
    expect(parseTrainerWrite({ idKey: 'Uno', code: entry('Uno', 1) }).idKey).toBe('Uno')
  })

  it('avisa si el fichero no tiene la lista', () => {
    expect(() => upsertTrainer('const x = 1\n', 'Uno', entry('Uno', 1))).toThrow()
  })
})
