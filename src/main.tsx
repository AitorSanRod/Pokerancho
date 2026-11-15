import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
// Antes que App: los estilos de cada pantalla se cargan después y pueden pisar a los base
import './index.css'
import App from './App.tsx'
import { startAppUpdates } from './net/appUpdate'
import { bootGame } from './store/boot'
import { ErrorBoundary } from './ui/shared/ErrorBoundary'
import { OtherTabScreen } from './ui/shared/OtherTabScreen'

startAppUpdates()

const root = createRoot(document.getElementById('root')!)
const show = (screen: ReactNode) =>
  root.render(
    <StrictMode>
      <ErrorBoundary>{screen}</ErrorBoundary>
    </StrictMode>,
  )

void bootGame().then((boot) => {
  if (boot.playing) return show(<App />)
  show(<OtherTabScreen onPlayHere={() => void boot.playHere().then(() => show(<App />))} />)
})
