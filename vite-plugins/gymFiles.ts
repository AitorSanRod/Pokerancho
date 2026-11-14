// Cambios de texto en src/data/gyms.ts para guardar un gimnasio desde el editor: su entrada en GYMS (sustituida o al
// final) y, si es nuevo, su clave en GymId (ver recordFiles.ts).

import { addId, hasId, parseEntryWrite, upsertEntry, type EntryWrite, type RecordFile } from './recordFiles.ts'

export const GYMS_FILE: RecordFile = { dict: 'GymId', record: 'GYMS', file: 'gyms.ts' }

export type GymWrite = EntryWrite

export const parseGymWrite = (body: unknown): GymWrite => parseEntryWrite(GYMS_FILE, body)
export const hasGymId = (text: string, key: string) => hasId(GYMS_FILE, text, key)
export const addGymId = (text: string, key: string, value: string) => addId(GYMS_FILE, text, key, value)
export const upsertGym = (text: string, key: string, code: string) => upsertEntry(GYMS_FILE, text, key, code)
