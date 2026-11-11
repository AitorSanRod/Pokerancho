import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reloadApp } from '../../net/appUpdate'
import { ErrorReportButton } from './ErrorReportButton'

interface ErrorState {
  error: Error | null
  /** Componentes de React por los que pasó el error (para el informe) */
  component: string
}

/**
 * Muestra el error en pantalla (en el móvil no hay consola a mano), permite enviarlo al servidor y reintentar sin
 * tocar la partida
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorState> {
  state: ErrorState = { error: null, component: '' }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    this.setState({ component: info.componentStack ?? '' })
  }

  render() {
    const { error, component } = this.state
    if (!error) return this.props.children
    return (
      <div className="app">
        <div className="screen scroll">
          <h2 className="section-title">Algo ha fallado</h2>
          <pre className="error-box">{`${error.message}\n\n${error.stack ?? ''}`}</pre>
          <ErrorReportButton key={error.message} error={error} component={component} />
          <button className="btn primary" onClick={() => this.setState({ error: null, component: '' })}>
            Reintentar
          </button>
          <button className="btn" onClick={() => void reloadApp()}>
            Recargar aplicación
          </button>
        </div>
      </div>
    )
  }
}
