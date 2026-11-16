/** Mientras llega el código de una pantalla (ver ui/lazyScreens.ts): solo se ve si tarda (layout.css) */
export function ScreenLoading() {
  return (
    <div className="screen screen-loading small" role="status">
      Cargando…
    </div>
  )
}
