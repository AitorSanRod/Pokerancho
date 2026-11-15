import { describe, expect, it } from 'vitest'
import { Gender, NAMELESS_CLASSES, TRAINER_CLASSES, TrainerClass } from '../../data/trainerClasses'
import { TRAINER_NAMES, TrainerName } from '../../data/trainerNames'
import { TRAINERS } from '../../data/trainers'
import { seqRng } from '../core/test-utils'
import { classGenders, fitsClass, fixedWho, namesOf, pickTrainerWho, trainerIdentity } from './trainerIdentity'

const CLASSES = Object.values(TrainerClass)
const named = (c: TrainerClass) => !NAMELESS_CLASSES.includes(c)
const withBoth = CLASSES.find((c) => named(c) && classGenders(c).length === 2)!
const nameOf = (g: Gender) => namesOf(g)[0]

describe('quién es un entrenador', () => {
  it('sin nada fijo: al azar un género de su clase y un nombre de ese género', () => {
    for (const roll of [0, 0.99]) {
      const who = pickTrainerWho({ trainerClass: withBoth }, seqRng(roll))
      expect(classGenders(withBoth)).toContain(who.gender)
      expect(TRAINER_NAMES[who.name!].gender).toBe(who.gender)
    }
    const genders = [0, 0.99].map((roll) => pickTrainerWho({ trainerClass: withBoth }, seqRng(roll)).gender)
    expect(new Set(genders).size).toBe(2)
  })

  it('con género fijo, el nombre al azar es de ese género; con nombre fijo, ese nombre', () => {
    const [, second] = classGenders(withBoth)
    expect(pickTrainerWho({ trainerClass: withBoth, gender: second }, seqRng(0.5)).gender).toBe(second)
    const name = nameOf(Gender.Female)
    expect(pickTrainerWho({ trainerClass: withBoth, name }, seqRng(0.5))).toEqual({ gender: Gender.Female, name })
  })

  it('las clases sin nombre se quedan sin él', () => {
    for (const c of NAMELESS_CLASSES) expect(pickTrainerWho({ trainerClass: c }, seqRng(0.5)).name).toBeUndefined()
  })
})

describe('cómo se ve', () => {
  it('el título del género seguido del nombre, y el dibujo de ese género', () => {
    for (const g of classGenders(withBoth)) {
      const name = nameOf(g)
      const style = TRAINER_CLASSES[withBoth][g]!
      expect(trainerIdentity({ trainerClass: withBoth }, { gender: g, name })).toEqual({ ...style, name: `${style.title} ${TRAINER_NAMES[name].name}` })
    }
  })

  it('sin nombre, o con uno que ya no está en la lista, solo el título', () => {
    const [g] = classGenders(withBoth)
    const title = TRAINER_CLASSES[withBoth][g]!.title
    expect(trainerIdentity({ trainerClass: withBoth }, { gender: g }).name).toBe(title)
    expect(trainerIdentity({ trainerClass: withBoth }, { gender: g, name: 'quitado' as TrainerName }).name).toBe(title)
  })

  it('un género que su clase no tiene se ve con el primero de la clase', () => {
    const single = CLASSES.find((c) => classGenders(c).length === 1)!
    const other = Object.values(Gender).find((g) => g !== classGenders(single)[0])!
    expect(fitsClass({ trainerClass: single, gender: other })).toBe(false)
    expect(trainerIdentity({ trainerClass: single }, { gender: other }).look).toBe(TRAINER_CLASSES[single][classGenders(single)[0]]!.look)
  })

  it('sin ruta, lo fijo: su nombre o solo el título', () => {
    expect(fixedWho({ trainerClass: withBoth }).name).toBeUndefined()
    expect(fixedWho({ trainerClass: withBoth, name: nameOf(Gender.Female) }).gender).toBe(Gender.Female)
  })
})

describe('datos de entrenadores', () => {
  it('cada clase tiene algún género y, si lleva nombre, nombres para cada uno', () => {
    for (const c of CLASSES) {
      expect(classGenders(c).length).toBeGreaterThan(0)
      if (named(c)) for (const g of classGenders(c)) expect(namesOf(g).length).toBeGreaterThan(0)
    }
  })

  it('todos los entrenadores del juego encajan con su clase', () => {
    for (const t of Object.values(TRAINERS)) expect(fitsClass(t)).toBe(true)
  })
})
