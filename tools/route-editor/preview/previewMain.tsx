// Vista previa del editor (va en un iframe para tener los estilos del juego sin tocar los del editor): pinta con los
// componentes del juego lo que hay en el formulario. El editor le manda el borrador con postMessage cada vez que cambia.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../../src/index.css'
import '../../../src/ui/route/run.css'
import '../../../src/ui/route/route.css'
import { installTypeColors } from '../../../src/ui/shared/typeColors'
import { Preview } from './Preview'
import './preview.css'

installTypeColors()

// El editor ajusta el alto del iframe a lo que ocupa la vista previa
const root = document.getElementById('root')!
new ResizeObserver(() => parent.postMessage({ previewHeight: root.scrollHeight }, location.origin)).observe(root)

createRoot(root).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
)
