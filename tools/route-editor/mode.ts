// Lo que necesita el editor de cada cosa que sabe escribir (una ruta, una incursión): su borrador, su formulario, su
// código y sus avisos. `main.ts` solo habla con el modo activo.

export interface ModeDef<D extends object> {
  /** Nombre en la cabecera: «Ruta», «Incursión» */
  label: string
  /** Texto del botón de empezar otra; sin él, «<label> nueva» */
  newLabel?: string
  empty(): D
  load(): D
  save(d: D): void
  form(d: D): string
  code(d: D): string
  /** Lo que hay que añadir aparte (ids nuevos, imports); vacío si nada */
  extra(d: D): string
  /** Dónde se pega el código (HTML) */
  codeHint(d: D): string
  issues(d: D): string[]
  summary(d: D): string
  actions: Record<string, (d: D, data: DOMStringMap) => void>
  /** Lo que hay en el juego para cargar: [valor, nombre] */
  gameOptions(): [string, string][]
  /** Borrador de lo del juego con ese valor; `null` si se cancela */
  fromGame(value: string): D | null
  /** Borrador a partir del código pegado; lanza un error legible si no se entiende */
  parse(text: string): D
  /** Explicación del diálogo de pegar (HTML) */
  pasteHint: string
  /** Guarda el código en los ficheros del juego (con `npm run dev`); devuelve el aviso. Sin él, no sale el botón */
  write?(d: D): Promise<string>
}

export interface EditorMode {
  label: string
  newLabel: string
  pasteHint: string
  /** El borrador, para leer y escribir sus campos */
  root(): object
  reset(): void
  loadGame(value: string): boolean
  paste(text: string): void
  act(action: string, data: DOMStringMap): void
  save(): void
  form(): string
  code(): string
  extra(): string
  codeHint(): string
  issues(): string[]
  summary(): string
  gameOptions(): [string, string][]
  /** Guardar en el juego; `undefined` si este modo no sabe */
  write?: () => Promise<string>
}

/** El modo con su borrador dentro (cargado de lo guardado) */
export function editorMode<D extends object>(def: ModeDef<D>): EditorMode {
  let draft = def.load()
  return {
    label: def.label,
    newLabel: def.newLabel ?? `${def.label} nueva`,
    pasteHint: def.pasteHint,
    root: () => draft,
    reset: () => (draft = def.empty()),
    loadGame: (value) => {
      const loaded = def.fromGame(value)
      if (loaded) draft = loaded
      return !!loaded
    },
    paste: (text) => (draft = def.parse(text)),
    act: (action, data) => def.actions[action](draft, data),
    save: () => def.save(draft),
    form: () => def.form(draft),
    code: () => def.code(draft),
    extra: () => def.extra(draft),
    codeHint: () => def.codeHint(draft),
    issues: () => def.issues(draft),
    summary: () => def.summary(draft),
    gameOptions: def.gameOptions,
    write: def.write && (() => def.write!(draft)),
  }
}

/** Borrador guardado en el navegador con esa clave; si no hay (o no se puede leer), uno vacío */
export function loadStored<D extends object>(key: string, empty: () => D): D {
  try {
    const saved = localStorage.getItem(key)
    return saved ? { ...empty(), ...JSON.parse(saved) } : empty()
  } catch {
    return empty()
  }
}

export function store(key: string, d: object) {
  try {
    localStorage.setItem(key, JSON.stringify(d))
  } catch {
    // Sin almacenamiento: el borrador se pierde al recargar
  }
}
