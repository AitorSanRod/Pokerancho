// Cambios de texto en src/data/trainers.ts para guardar un entrenador desde el editor: su entrada en TRAINERS
// (sustituida o al final) y, si es nuevo, su clave en TrainerId (ver recordFiles.ts).

import { addId, hasId, parseEntryWrite, upsertEntry, type EntryWrite, type RecordFile } from './recordFiles.ts'

export const TRAINERS_FILE: RecordFile = { dict: 'TrainerId', record: 'TRAINERS', file: 'trainers.ts' }

export const parseTrainerWrite = (body: unknown): EntryWrite => parseEntryWrite(TRAINERS_FILE, body)
export const hasTrainerId = (text: string, key: string) => hasId(TRAINERS_FILE, text, key)
export const addTrainerId = (text: string, key: string, value: string) => addId(TRAINERS_FILE, text, key, value)
export const upsertTrainer = (text: string, key: string, code: string) => upsertEntry(TRAINERS_FILE, text, key, code)
