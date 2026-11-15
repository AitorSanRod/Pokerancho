-- Los jefes de la pestaña Raids van ahora por un calendario fijo, igual para todos (30 min de sala abierta y 30 min de
-- pelea, ver src/game/raid/raidSchedule.ts), y las paradas de ruta con jefe ya no tienen sala: las salas y los ciclos
-- de antes no sirven. La tabla rooms guarda ahora SharedRaid (src/game/raid/online/sharedRaid.ts); `players` cuenta
-- los Pokémon de jugadores sentados y `summary` ya no se usa.
DELETE FROM rooms;
DROP TABLE raid_cycles;
