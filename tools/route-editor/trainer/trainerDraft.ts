// Borrador de un entrenador en el editor: claves de los diccionarios (TrainerLook) en lugar de sus valores. Su equipo,
// en team/teamDraft.ts.

import type { Trainer } from '../../../src/data/trainers'
import { DICTS, keyOf } from '../catalog'
import { loadStored, store } from '../mode'
import { emptyFoe, foeDraft, type FoeDraft } from '../team/teamDraft'
import { LOOKS } from './trainerCatalog'

export interface TrainerDraft {
  /** Clave de TrainerId: `MarineroDani` */
  idKey: string
  /** Valor de TrainerId (solo cuenta si es nuevo): `marinero-dani` */
  idValue: string
  /** Nombre tal y como se ve: «Marinero Dani» */
  name: string
  /** Clave de TrainerLook: `Sailor` */
  look: string
  team: FoeDraft[]
}

export const emptyTrainer = (): TrainerDraft => ({ idKey: '', idValue: '', name: '', look: LOOKS[0][0], team: [emptyFoe()] })

/** Borrador de un entrenador del juego (o pegado) */
export const fromTrainer = (idKey: string, idValue: string, t: Trainer): TrainerDraft => ({
  idKey,
  idValue,
  name: t.name,
  look: keyOf(DICTS.TrainerLook, t.look),
  team: t.team.map(foeDraft),
})

const STORAGE_KEY = 'trainer-editor-draft'

export const loadTrainerDraft = (): TrainerDraft => loadStored(STORAGE_KEY, emptyTrainer)
export const saveTrainerDraft = (d: TrainerDraft) => store(STORAGE_KEY, d)
