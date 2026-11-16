import { IMOVE, type IncursionMove } from '../incursionMoves'
import { Rarity } from '../species'
import { PokeType } from '../types'

// Escalera de ataques de combate de cada tipo (rutas, torre y raids; las incursiones tienen su repertorio aparte, ver
// data/learnsets.ts). Cada Pokémon aprende la de cada uno de sus tipos, peldaño a peldaño según su nivel, y se queda con
// todo lo aprendido: elige cuál lleva. Los tres primeros peldaños son para todos; los de arriba piden una rareza mínima,
// así un común no llega a los ataques de un legendario. Los valores salen del ataque de incursión con los ajustes de
// tuning.ts. Para editar a mano.

/** Un peldaño: el ataque, desde qué nivel y (si la pide) la rareza mínima de la especie */
export interface CombatStep {
  move: IncursionMove
  level: number
  minRarity?: Rarity
}

/** Nivel desde el que se aprende cada peldaño */
export const LADDER_LEVELS = {
  /** El de salida (≈40 de potencia) */
  basic: 1,
  /** Uno algo más fuerte y con efecto (≈55-65) */
  effect: 10,
  /** El techo de los comunes (≈70-75) */
  strong: 25,
  /** El de los raros (≈80-90); solo raros o más */
  rare: 20,
  /** El de los épicos (≈90-110); solo épicos o legendarios */
  epic: 35,
  /** El de los legendarios (≈120) */
  legendary: 50,
}

/** La escalera de un tipo, de abajo arriba; cada peldaño con su nivel de LADDER_LEVELS */
function ladder(basic: IncursionMove, effect: IncursionMove, strong: IncursionMove, rare: IncursionMove, epic: IncursionMove, legendary: IncursionMove): CombatStep[] {
  return [
    { move: basic, level: LADDER_LEVELS.basic },
    { move: effect, level: LADDER_LEVELS.effect },
    { move: rare, level: LADDER_LEVELS.rare, minRarity: Rarity.Rare },
    { move: strong, level: LADDER_LEVELS.strong },
    { move: epic, level: LADDER_LEVELS.epic, minRarity: Rarity.Epic },
    { move: legendary, level: LADDER_LEVELS.legendary, minRarity: Rarity.Legendary },
  ]
}

const I = IMOVE

/** Lo que aprende en combate un Pokémon de cada tipo */
export const COMBAT_LADDERS: Record<PokeType, CombatStep[]> = {
  [PokeType.Normal]: ladder(I.AtaqueRapido, I.Agarre, I.PunoMareo, I.GolpeCuerpo, I.DobleFilo, I.Hiperrayo),
  [PokeType.Fire]: ladder(I.Ascuas, I.RuedaFuego, I.PunoFuego, I.Lanzallamas, I.Llamarada, I.Sofoco),
  [PokeType.Water]: ladder(I.AcuaJet, I.Hidropulso, I.ConchaFilo, I.AcuaCola, I.Hidrobomba, I.Hidrocanon),
  [PokeType.Electric]: ladder(I.Impactrueno, I.Electrotela, I.PunoTrueno, I.Rayo, I.Trueno, I.PlacajeElectrico),
  [PokeType.Grass]: ladder(I.LatigoCepa, I.HojaMagica, I.Gigadrenado, I.Energibola, I.RayoSolar, I.PlantaFeroz),
  [PokeType.Ice]: ladder(I.CantoHelado, I.VientoHielo, I.PunoHielo, I.RayoHielo, I.MartilloHielo, I.RayoGelido),
  [PokeType.Fighting]: ladder(I.Ultrapuno, I.Palmeo, I.PunoDrenaje, I.EsferaAural, I.OndaCertera, I.ABocajarro),
  [PokeType.Poison]: ladder(I.Acido, I.ColmilloVeneno, I.Residuos, I.BombaLodo, I.OndaToxica, I.Lanzamugre),
  [PokeType.Ground]: ladder(I.BofetonLodo, I.DisparoLodo, I.ArenasArdientes, I.TierraViva, I.Terremoto, I.FiloDelAbismo),
  [PokeType.Flying]: ladder(I.Tornado, I.AtaqueAla, I.TajoAereo, I.Vuelo, I.Vendaval, I.AtaqueAereo),
  [PokeType.Psychic]: ladder(I.Confusion, I.Psicorrayo, I.Psicocorte, I.Psiquico, I.OndaMental, I.Psicoataque),
  [PokeType.Bug]: ladder(I.CorteFuria, I.Estoicismo, I.DobleRayo, I.TijeraX, I.Zumbido, I.Megacuerno),
  [PokeType.Rock]: ladder(I.Lanzarrocas, I.TumbaRocas, I.Avalancha, I.JoyaDeLuz, I.RocaAfilada, I.Testarazo),
  [PokeType.Ghost]: ladder(I.SombraVil, I.PunoSombra, I.GarraUmbria, I.BolaSombra, I.GolpeFantasma, I.GolpeUmbrio),
  [PokeType.Dragon]: ladder(I.Ciclon, I.Dragoaliento, I.ColaDragon, I.GarraDragon, I.PulsoDragon, I.Enfado),
  [PokeType.Dark]: ladder(I.Mordisco, I.Alarido, I.TajoUmbrio, I.Triturar, I.PulsoNoche, I.JuegoSucio),
  [PokeType.Steel]: ladder(I.PunoBala, I.BombaIman, I.CuernoCertero, I.CabezaDeHierro, I.FocoResplandor, I.ColaFerrea),
  [PokeType.Fairy]: ladder(I.VientoFeerico, I.BesoDrenaje, I.Carantona, I.BrilloMagico, I.FuerzaLunar, I.LuzAniquiladora),
}
