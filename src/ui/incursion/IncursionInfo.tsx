import { createPortal } from 'react-dom'
import { GROUP_PASSIVE_THRESHOLDS, RARITY_WEIGHT } from '../../data/incursionPassives'
import { MAX_KEYS } from '../../data/incursions'
import { RARITY_INFO, Rarity } from '../../data/species'
import { REGROUP_MS } from '../../game/incursion/activeIncursion'
import { PARTY_SIZE } from '../../game/incursion/party'
import { STATUS_MAX_TURNS } from '../../game/incursion/groupStatus'
import { INCURSION_REVIVES, REVIVE_HP } from '../../game/incursion/revives'
import '../shared/overlays.css'

const pct = (n: number) => `${Math.round(n * 100)}%`
const weights = Object.values(Rarity).map((r) => `${RARITY_INFO[r].name.toLowerCase()} ${RARITY_WEIGHT[r]}`).join(', ')

const SECTIONS: { title: string; text: string }[] = [
  {
    title: 'Qué es',
    text: `Una mazmorra para ${PARTY_SIZE}: una serie de salas (combates, descansos y un jefe al final) que el grupo recorre junto. Se entra con una llave de esa incursión, que se compra en la Tienda (hasta ${MAX_KEYS} de cada una) y se gasta al empezar.`,
  },
  {
    title: 'Antes de entrar',
    text: 'Eliges un Pokémon del rancho y un movimiento de su repertorio. Ese movimiento decide su papel: golpear, curar, provocar (atraer los golpes), subir stats al grupo, bajarlas a los rivales o poner estados. Después, el combate va solo, por turnos.',
  },
  {
    title: 'En plena pelea',
    text: `Cuando quieras, cambia el ataque de tu Pokémon y a quién lo dirige (un rival o un aliado, según el ataque, o automático). Vale desde el turno siguiente y sigue así hasta que lo vuelvas a cambiar. Los estados alterados duran como mucho ${STATUS_MAX_TURNS} turnos (volver a ponerlos reinicia la cuenta) y se quitan al acabar cada sala.`,
  },
  {
    title: 'Nivel',
    text: 'Cada incursión tiene un nivel mínimo y uno máximo para entrar, y sus rivales tienen su propio nivel, que sube sala a sala. Cada Pokémon lucha con el nivel que tiene: uno de nivel alto pega más fuerte y la incursión acaba antes.',
  },
  {
    title: 'Pasivas de grupo',
    text: `Cada Pokémon suma a cada uno de sus tipos según su rareza (${weights}). Con ${GROUP_PASSIVE_THRESHOLDS.join(', ')} de un tipo, todo el grupo gana el nivel 1, 2 o 3 de su pasiva. Un Pokémon caído que ya no puede volver deja de sumar.`,
  },
  {
    title: 'Revivires',
    text: `El grupo tiene ${INCURSION_REVIVES} para toda la incursión. Se gastan solos: quien cae vuelve al turno siguiente con el ${pct(REVIVE_HP)} de sus PS. Sin revivires, el que cae se queda mirando hasta el final. Si caen todos y no queda ninguno, se pierde.`,
  },
  {
    title: 'Reorganizar',
    text: `Algunas incursiones tienen una sala para reorganizarse: ${Math.round(REGROUP_MS / 1000)} s para cambiar de movimiento viendo lo que lleva cada uno. Quien no lo cambie sigue con el suyo.`,
  },
  {
    title: 'Premios y retirada',
    text: 'Cada sala de combate superada da ₽ y EXP, que te quedas pase lo que pase. Al terminar la incursión llega el premio final: ₽, EXP, tickets y tickets de Pokémon. El grupo puede retirarse votando (hace falta la mitad de los jugadores, redondeando hacia arriba): se acaba en ese momento y se cobra lo ganado hasta ahí.',
  },
  {
    title: 'Mientras dura',
    text: 'Tu Pokémon sale del rancho, como en una expedición, y vuelve al terminar con los PS que le queden. Puedes cerrar la app: al volver, la incursión sigue por donde va.',
  },
]

/** Información de las incursiones: cómo funciona todo, con los números del juego */
export function IncursionInfo({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div className="confirm-overlay" onClick={onClose}>
      <div className="card incursion-info" role="dialog" aria-modal="true" aria-label="Cómo funcionan las incursiones" onClick={(e) => e.stopPropagation()}>
        <h3>Cómo funcionan las incursiones</h3>
        <div className="incursion-info-body">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h4>{s.title}</h4>
              <p className="small">{s.text}</p>
            </section>
          ))}
        </div>
        <button className="btn primary" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>,
    document.body,
  )
}
