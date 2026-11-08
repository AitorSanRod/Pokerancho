// Retirada por votación: votan los jugadores (no los bots), estén o no en pie. Hace falta la mitad, redondeando hacia
// arriba: 1 → 1, 2 → 1, 3 → 2, 4 → 2, 5 → 3.

export const votesNeeded = (players: number): number => Math.max(1, Math.ceil(players / 2))

export const retreatPasses = (votes: number, players: number): boolean => votes >= votesNeeded(players)
