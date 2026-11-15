// Borrador de un entrenador en el editor: claves de los diccionarios (TrainerClass, TrainerName, Gender) en lugar de
// sus valores. Su equipo, en team/teamDraft.ts.

import type { Trainer } from '../../../src/data/trainers'
import { fixedWho, trainerIdentity, type TrainerIdentity } from '../../../src/game/run/trainerIdentity'
import { DICTS, keyOf } from '../catalog'
import { loadStored, store } from '../mode'
import { emptyFoe, foeDraft, type FoeDraft } from '../team/teamDraft'
import { CLASS_TILES } from './trainerCatalog'

export interface TrainerDraft {
  /** Clave en TRAINERS, que es su TrainerId: `Joven1` */
  idKey: string
  /** Clave de TrainerClass: `Youngster` */
  trainerClass: string
  /** Clave de TrainerName (`Lucia`) si lleva nombre fijo; vacío: al azar en cada ruta */
  name: string
  /** Clave de Gender si lleva género fijo (y no nombre); vacío: al azar de su clase */
  gender: string
  team: FoeDraft[]
}

export const emptyTrainer = (): TrainerDraft => ({ idKey: '', trainerClass: CLASS_TILES[0].key, name: '', gender: '', team: [emptyFoe()] })

/** Borrador de un entrenador del juego (o pegado) */
export const fromTrainer = (idKey: string, t: Trainer): TrainerDraft => ({
  idKey,
  trainerClass: keyOf(DICTS.TrainerClass, t.trainerClass),
  name: t.name ? keyOf(DICTS.TrainerName, t.name) : '',
  gender: t.gender ? keyOf(DICTS.Gender, t.gender) : '',
  team: t.team.map(foeDraft),
})

const valueOf = <T>(dict: Record<string, T>, key: string): T | undefined => (key in dict ? dict[key] : undefined)

/** Clase, nombre y género fijos del borrador con los valores del juego (la clase, si no se conoce, la primera) */
export const draftWho = (d: TrainerDraft): Pick<Trainer, 'trainerClass' | 'name' | 'gender'> => ({
  trainerClass: valueOf(DICTS.TrainerClass, d.trainerClass) ?? Object.values(DICTS.TrainerClass)[0],
  name: valueOf(DICTS.TrainerName, d.name),
  gender: valueOf(DICTS.Gender, d.gender),
})

/** Cómo se ve con lo que lleva fijo (sin nombre fijo, solo el título: el nombre se elige en cada ruta) */
export const draftIdentity = (d: TrainerDraft): TrainerIdentity => {
  const who = draftWho(d)
  return trainerIdentity(who, fixedWho(who))
}

/** Con otra clave que la de antes: los borradores guardados con otra forma ya no sirven */
const STORAGE_KEY = 'trainer-editor-draft-v3'

export const loadTrainerDraft = (): TrainerDraft => loadStored(STORAGE_KEY, emptyTrainer)
export const saveTrainerDraft = (d: TrainerDraft) => store(STORAGE_KEY, d)
