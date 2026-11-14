import { useState } from 'react'
import type { GymId } from '../../../src/data/gyms'
import { Biome, NodeKind, type Route } from '../../../src/data/maps'
import type { TrainerId } from '../../../src/data/trainers'
import { LEADER_SPRITES } from '../../../src/ui/route/gym/leaderSprites'
import { TRAINER_SPRITES } from '../../../src/ui/route/gym/trainerSprites'
import { gymIdValue } from '../gym/gymCodegen'
import type { GymDraft } from '../gym/gymDraft'
import { trainerIdValue } from '../trainer/trainerCodegen'
import type { TrainerDraft } from '../trainer/trainerDraft'
import { CompanionPicker } from './CompanionPicker'
import { useCompanion } from './useCompanion'
import { draftToGym, draftToTrainer } from './draftData'
import { SimPanel } from './SimPanel'
import type { SimPatch } from './simulate'
import type { Stage } from './stage'
import { StopScene } from './StopScene'

export type TeamDraft = { kind: 'trainer'; draft: TrainerDraft } | { kind: 'gym'; draft: GymDraft }

/** Lo que se ve y lo que se simula: el equipo en escena y una ruta de una sola parada con él */
function teamSetup(t: TeamDraft, biome: Biome): { stage: Stage; route: Route; patch: SimPatch } {
  const isGym = t.kind === 'gym'
  const id = (t.kind === 'gym' ? gymIdValue(t.draft) : trainerIdValue(t.draft)) || 'borrador'
  const gym = t.kind === 'gym' ? draftToGym(t.draft) : null
  const trainer = t.kind === 'trainer' ? draftToTrainer(t.draft) : null
  const team = gym?.team ?? trainer?.team ?? []
  const name = gym?.leader ?? trainer?.name ?? ''
  const sprite = gym ? LEADER_SPRITES[id as GymId] : trainer && TRAINER_SPRITES[trainer.look]
  const levels = team.map((f) => f.level)
  const stop = isGym ? { kind: NodeKind.Gym, gym: id as GymId } : { kind: NodeKind.Trainer, trainer: id as TrainerId }
  const route: Route = {
    id: `vista-previa-${id}` as Route['id'],
    name,
    description: '',
    biome,
    levels: levels.length ? [Math.min(...levels), Math.max(...levels)] : [1, 1],
    encounters: [],
    reward: { tickets: 0, money: 0, exp: 0 },
    nodes: [
      { id: 's', name: 'Inicio', kind: NodeKind.Start, next: [{ to: 'x', steps: 1 }] },
      { id: 'x', name, next: [], ...stop },
    ],
  }
  const patch: SimPatch = gym ? { gym: [id as GymId, gym] } : trainer ? { trainer: [id as TrainerId, trainer] } : {}
  return { stage: { foes: team, boss: isGym, trainer: { name, sprite: sprite || undefined } }, route, patch }
}

const BIOMES = Object.entries(Biome)

/** El combate contra el equipo del borrador, sobre el fondo que se elija, y cuántas veces se le gana */
export function TeamPreview({ team }: { team: TeamDraft }) {
  const [companion, setCompanion] = useCompanion()
  const [biome, setBiome] = useState<Biome>(team.kind === 'gym' ? Biome.PewterCity : Biome.Ship)
  const { stage, route, patch } = teamSetup(team, biome)
  return (
    <>
      <h3>Tu Pokémon</h3>
      <CompanionPicker companion={companion} onChange={setCompanion} />
      <h3>
        En combate{' '}
        <select value={biome} onChange={(e) => setBiome(e.target.value as Biome)} aria-label="Fondo">
          {BIOMES.map(([k, v]) => (
            <option key={v} value={v}>
              {k}
            </option>
          ))}
        </select>
      </h3>
      {stage.foes.length ? (
        <StopScene biome={biome} signText={route.name} stopKey="team" stage={stage} companion={companion} />
      ) : (
        <p className="preview-note">Añade algún Pokémon al equipo para verlo.</p>
      )}
      {team.kind === 'trainer' && <p className="preview-note">Cada Pokémon suyo da EXP ×2 y el ₽ y los tickets de un salvaje.</p>}
      <h3>¿Le gana tu Pokémon?</h3>
      <SimPanel key={JSON.stringify([route, patch, companion])} route={route} companion={companion} patch={patch} walk={false} />
    </>
  )
}

