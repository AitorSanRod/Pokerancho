// Del borrador del editor a los datos del juego (Route, Trainer, Gym), para pintarlos con los componentes de verdad y
// simularlos con el motor. Lo que aún está a medias (un Pokémon mal escrito) se salta en lugar de romper la vista.

import type { Gym, GymFoe } from '../../../src/data/gyms'
import type { Encounter, Route, RouteNode } from '../../../src/data/maps'
import type { Trainer } from '../../../src/data/trainers'
import { DICTS } from '../catalog'
import { kebab } from '../codegen'
import type { EncDraft, NodeDraft, RouteDraft } from '../draft'
import type { GymDraft } from '../gym/gymDraft'
import { MOVE_IDS } from '../incursion/incCatalog'
import type { FoeDraft } from '../team/teamDraft'
import type { TrainerDraft } from '../trainer/trainerDraft'

const BACKDROPS = import.meta.glob<string>('../../../src/assets/routes/*', { eager: true, query: '?url', import: 'default' })

/** Imagen de `src/assets/routes/` por su nombre de fichero; undefined si no está */
export const backdropUrl = (file: string): string | undefined => Object.entries(BACKDROPS).find(([path]) => path.endsWith(`/${file}`))?.[1]

/** Valor de un diccionario del juego por su clave (`DICTS.Biome`, 'Forest' → 'forest') */
export const dictValue = <T>(dict: Record<string, T>, key: string): T | undefined => (key in dict ? dict[key] : undefined)

export const speciesOf = (key: string): number | undefined => dictValue<number>(DICTS.POKEMON, key)

const encountersOf = (list: EncDraft[]): Encounter[] =>
  list.flatMap((e) => (speciesOf(e.species) ? [{ speciesId: speciesOf(e.species)!, chance: Number(e.chance) || 0 }] : []))

function bossOf(n: NodeDraft) {
  const speciesId = speciesOf(n.boss.species)
  if (!speciesId) return undefined
  const tier = n.kind === 'Raid' ? dictValue(DICTS.RaidTier, n.boss.tier) : undefined
  return { speciesId, level: n.boss.level, passives: n.boss.passives, tier, soloMinutes: n.boss.soloMinutes ?? undefined }
}

function nodeOf(n: NodeDraft, next: NodeDraft | undefined): RouteNode {
  const kind = dictValue(DICTS.NodeKind, n.kind) ?? DICTS.NodeKind.Wild
  return {
    id: n.id,
    name: n.name,
    kind,
    next: next ? [{ to: next.id, steps: Number(next.steps) || 1 }] : [],
    landmark: dictValue(DICTS.StopLandmark, n.landmark),
    levelBonus: n.kind === 'Wild' ? (n.levelBonus ?? undefined) : undefined,
    statMult: n.kind === 'Wild' || n.kind === 'Boss' ? (n.statMult ?? undefined) : undefined,
    encounters: n.kind === 'Wild' && n.ownEncounters ? encountersOf(n.encounters) : undefined,
    boss: n.kind === 'Boss' || n.kind === 'Raid' ? bossOf(n) : undefined,
    potion: n.kind === 'Heal' ? dictValue(DICTS.Potion, n.potion) : undefined,
    gym: n.kind === 'Gym' ? dictValue(DICTS.GymId, n.gym) : undefined,
    trainer: n.kind === 'Trainer' ? dictValue(DICTS.TrainerId, n.trainer) : undefined,
  }
}

/** El RouteId de la ruta: el del juego si ya existe, o el nuevo */
export const draftRouteId = (d: RouteDraft) => dictValue<string>(DICTS.RouteId, d.idKey) ?? (d.idValue || kebab(d.idKey) || 'borrador')

export function draftToRoute(d: RouteDraft): Route {
  const image = d.useBackdrop ? backdropUrl(d.backdropFile) : undefined
  return {
    id: draftRouteId(d) as Route['id'],
    name: d.name || 'Sin nombre',
    description: d.description,
    biome: dictValue(DICTS.Biome, d.biome) ?? DICTS.Biome.Meadow,
    backdrop: image ? { image, focusY: d.focusY } : undefined,
    levels: d.levels,
    encounters: encountersOf(d.encounters),
    reward: d.reward,
    unlocks: dictValue(DICTS.RouteId, d.unlocks),
    nodes: d.nodes.map((n, i) => nodeOf(n, d.nodes[i + 1])),
  }
}

/** El equipo del borrador, sin los Pokémon aún sin escribir */
export const teamOf = (team: FoeDraft[]): GymFoe[] =>
  team.flatMap((f) => {
    const speciesId = speciesOf(f.species)
    if (!speciesId) return []
    const moves = f.moves.map((m) => MOVE_IDS[m]).filter(Boolean)
    return [{ speciesId, level: f.level, statMult: f.statMult ?? undefined, passives: f.passives, moves: moves.length ? moves : undefined }]
  })

export const draftToTrainer = (d: TrainerDraft): Trainer => ({
  name: d.name || 'Entrenador',
  look: dictValue(DICTS.TrainerLook, d.look) ?? DICTS.TrainerLook.Sailor,
  team: teamOf(d.team),
})

export const draftToGym = (d: GymDraft): Gym => ({
  leader: d.leader || 'Líder',
  badge: dictValue(DICTS.Badge, d.badge) ?? DICTS.Badge.Boulder,
  maxLevel: d.maxLevel,
  team: teamOf(d.team),
})
