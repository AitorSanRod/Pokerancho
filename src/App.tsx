import { Suspense, useEffect, useState } from 'react'
import type { Item } from './data/items'
import { combinableIds } from './game/collection/pieces'
import { TutorialStep } from './game/core/state'
import { startAccount } from './net/account'
import { startCloudSync } from './net/cloudSync'
import { startPush } from './net/push'
import { startIncursionSync } from './net/incursionSync'
import { startScheduleSync } from './net/scheduleSync'
import { startServerGifts } from './net/serverGifts'
import { startRaidSync } from './net/raidSync'
import { startTradeBoard } from './net/tradeBoard'
import { AccountHost } from './ui/account/AccountHost'
import { ScreenLoading } from './ui/shared/ScreenLoading'
import { UpdatePrompt } from './ui/shared/UpdatePrompt'
import { act, useGame } from './store/store'
import { tick } from './game/core/tick'
import { isExpeditionDone } from './game/team/expedition'
import { battleHold } from './ui/route/foeReady'
import { TopBar } from './ui/shared/TopBar'
import { TutorialNavHint } from './ui/shared/TutorialHint'
import { ICON } from './ui/shared/icons'
import { ItemIcon } from './ui/shared/ItemIcon'
import { listenPushNavigation, listenTabRequests, type AppTab } from './ui/shared/navigation'
import { pendingKey, useUnseen } from './ui/shared/useUnseen'
import { useMenuPending } from './ui/ranch/useMenuPending'
import { CommunityScreen, GachaScreen, preloadScreens, RanchScreen, RouteScreen, ShopScreen, StarterScreen } from './ui/lazyScreens'

const TABS: { id: AppTab; icon: Item; label: string }[] = [
  { id: 'route', icon: ICON.Route, label: 'Ruta' },
  { id: 'community', icon: ICON.Incursion, label: 'Comunidad' },
  { id: 'ranch', icon: ICON.Ranch, label: 'Rancho' },
  { id: 'dex', icon: ICON.Dex, label: 'Pokédex' },
  { id: 'shop', icon: ICON.Shop, label: 'Tienda' },
]
const TICK_MS = 250

export default function App() {
  const game = useGame()
  const [tab, setTab] = useState<AppTab>(game.run ? 'route' : 'ranch')

  // Bucle de juego: el primer tick también aplica el progreso hecho con la app cerrada
  useEffect(() => {
    act((s) => tick(s, Date.now()))
    // El combate que va a empezar espera mientras su pantalla no tiene aún la imagen del rival (foeReady.ts)
    const id = setInterval(() => act((s) => tick(s, Date.now(), battleHold)), TICK_MS)
    return () => clearInterval(id)
  }, [])
  useEffect(preloadScreens, [])
  // Otras pantallas pueden llevar a una pestaña (p. ej. comprar una llave en la Tienda)
  useEffect(() => listenTabRequests(setTab), [])
  useEffect(listenPushNavigation, [])
  // Salas de los jefes de la pestaña Raids: entrar, ponerse al día y avisar al salir
  useEffect(startRaidSync, [])
  useEffect(startIncursionSync, [])
  useEffect(startScheduleSync, [])
  // Regalos del servidor, para todos o para este jugador (en Notificaciones)
  useEffect(startServerGifts, [])
  // Notificaciones push: el plan de avisos al ocultarse la app y la suscripción al día con la cuenta
  useEffect(startPush, [])
  // Cuenta opcional: sesión, enlaces de los correos y partida en la nube
  useEffect(() => {
    void startAccount()
    return startCloudSync()
  }, [])
  // Intercambios: el tablón y lo pendiente de recoger en Notificaciones (con cuenta)
  useEffect(startTradeBoard, [])

  // Los puntos rojos se apagan al entrar en la pestaña y vuelven si aparece algo nuevo
  const runNeedsLook = game.run && game.run.phase !== 'walking' ? [`${game.run.routeId}:${game.run.phase}`] : []
  const routePending = pendingKey([...runNeedsLook, ...game.expeditions.filter(isExpeditionDone).map((e) => e.uid)])
  const communityPending = pendingKey([...game.raidPrizes.map((p) => p.uid), ...(game.incursionCheckin ? [game.incursionCheckin.scheduleId] : [])])
  const badges: Record<AppTab, boolean> = {
    route: useUnseen('tab:route', routePending, tab === 'route'),
    community: useUnseen('tab:community', communityPending, tab === 'community'),
    ranch: useUnseen('tab:ranch', useMenuPending(game), tab === 'ranch'),
    dex: useUnseen('tab:dex-nav', pendingKey(combinableIds(game)), tab === 'dex'),
    shop: false,
  }

  if (game.tutorial === TutorialStep.Starter) {
    return (
      <div className="app">
        <Suspense fallback={<ScreenLoading />}>
          <StarterScreen />
        </Suspense>
        <AccountHost game={game} />
        <UpdatePrompt />
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar game={game} />
      <AccountHost game={game} />
      <UpdatePrompt />

      <main className="content">
        <Suspense fallback={<ScreenLoading />}>
          {tab === 'route' && <RouteScreen game={game} />}
          {tab === 'community' && <CommunityScreen game={game} />}
          {tab === 'ranch' && <RanchScreen game={game} />}
          {tab === 'dex' && <GachaScreen game={game} />}
          {tab === 'shop' && <ShopScreen game={game} />}
        </Suspense>
        <TutorialNavHint game={game} currentTab={tab} tabIds={TABS.map((t) => t.id)} />
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            aria-label={badges[t.id] ? `${t.label} (hay novedades)` : undefined}
            onClick={() => setTab(t.id)}
          >
            <span className="nav-icon">
              <ItemIcon item={t.icon} size={30} off={tab !== t.id} />
              {badges[t.id] && <span className="dot" />}
            </span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
