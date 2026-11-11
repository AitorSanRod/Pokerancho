// Diálogo de pegar código: carga lo pegado en el modo activo o enseña el error.

import type { EditorMode } from './mode'

export function setupPaste(current: () => EditorMode, onLoad: () => void) {
  const dialog = document.getElementById('paste-dialog') as HTMLDialogElement
  const title = document.getElementById('paste-title') as HTMLHeadingElement
  const hint = document.getElementById('paste-hint') as HTMLParagraphElement
  const input = document.getElementById('paste-text') as HTMLTextAreaElement
  const error = document.getElementById('paste-error') as HTMLParagraphElement
  document.getElementById('paste')!.addEventListener('click', () => {
    const mode = current()
    title.textContent = `Pegar ${mode.label.toLowerCase()}`
    hint.innerHTML = mode.pasteHint
    error.textContent = ''
    dialog.showModal()
    input.focus()
  })
  document.getElementById('paste-cancel')!.addEventListener('click', () => dialog.close())
  document.getElementById('paste-load')!.addEventListener('click', () => {
    try {
      current().paste(input.value)
      dialog.close()
      onLoad()
    } catch (e) {
      error.textContent = (e as Error).message
    }
  })
}
