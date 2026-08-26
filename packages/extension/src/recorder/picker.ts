import { resolveSelector, type ResolvedSelector } from './selector'

const OVERLAY_ID = 'playwigo-picker-overlay'
const HIGHLIGHT_ID = 'playwigo-picker-highlight'
const HINT_ID = 'playwigo-picker-hint'

export type PickedElement = ResolvedSelector & {
  /** When the user held Alt/Option while picking. */
  action?: 'hover'
}

export type PickerCallbacks = {
  onPick: (picked: PickedElement) => void
  onCancel: () => void
}

let active = false
let callbacks: PickerCallbacks | null = null
let altHeld = false

function ensureOverlay() {
  let overlay = document.getElementById(OVERLAY_ID)
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = OVERLAY_ID
    overlay.setAttribute('data-playwigo-ignore', 'true')
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483646',
      cursor: 'crosshair',
      background: 'transparent',
    })
    document.documentElement.appendChild(overlay)
  }

  let highlight = document.getElementById(HIGHLIGHT_ID)
  if (!highlight) {
    highlight = document.createElement('div')
    highlight.id = HIGHLIGHT_ID
    highlight.setAttribute('data-playwigo-ignore', 'true')
    Object.assign(highlight.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '2147483647',
      border: '2px solid #c97816',
      background: 'rgba(201, 120, 22, 0.12)',
      borderRadius: '4px',
      display: 'none',
    })
    document.documentElement.appendChild(highlight)
  }

  let hint = document.getElementById(HINT_ID)
  if (!hint) {
    hint = document.createElement('div')
    hint.id = HINT_ID
    hint.setAttribute('data-playwigo-ignore', 'true')
    Object.assign(hint.style, {
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '2147483647',
      pointerEvents: 'none',
      padding: '8px 12px',
      borderRadius: '8px',
      background: 'rgba(20, 20, 20, 0.92)',
      color: '#f5f5f5',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      fontSize: '12px',
      lineHeight: '1.4',
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      whiteSpace: 'nowrap',
    })
    document.documentElement.appendChild(hint)
  }

  updateHint()
  return { overlay, highlight, hint }
}

function updateHint() {
  const hint = document.getElementById(HINT_ID)
  if (!hint) return
  hint.textContent = altHeld
    ? 'Alt/⌥ held — click to pick as Hover · Esc to cancel'
    : 'Click to pick · hold Alt/⌥ + click for Hover · Esc to cancel'
}

function clearOverlay() {
  document.getElementById(OVERLAY_ID)?.remove()
  document.getElementById(HIGHLIGHT_ID)?.remove()
  document.getElementById(HINT_ID)?.remove()
}

function elementFromPoint(x: number, y: number) {
  const el = document.elementFromPoint(x, y)
  if (!el) return null
  if (el.id === OVERLAY_ID || el.id === HIGHLIGHT_ID || el.id === HINT_ID) {
    // Temporarily hide overlay to hit the real element.
    const overlay = document.getElementById(OVERLAY_ID)
    const highlight = document.getElementById(HIGHLIGHT_ID)
    if (overlay) overlay.style.pointerEvents = 'none'
    if (highlight) highlight.style.display = 'none'
    const under = document.elementFromPoint(x, y)
    if (overlay) overlay.style.pointerEvents = 'auto'
    return under
  }
  return el
}

function onMove(event: MouseEvent) {
  altHeld = event.altKey
  updateHint()
  const { highlight } = ensureOverlay()
  const el = elementFromPoint(event.clientX, event.clientY)
  if (!el || el === document.documentElement || el === document.body) {
    highlight.style.display = 'none'
    return
  }
  const rect = el.getBoundingClientRect()
  const hoverMode = event.altKey
  Object.assign(highlight.style, {
    display: 'block',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: hoverMode ? '2px solid #7c3aed' : '2px solid #c97816',
    background: hoverMode
      ? 'rgba(124, 58, 237, 0.14)'
      : 'rgba(201, 120, 22, 0.12)',
  })
}

function onClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  event.stopImmediatePropagation()

  const el = elementFromPoint(event.clientX, event.clientY)
  if (!el) return

  const resolved = resolveSelector(el)
  const cb = callbacks
  const asHover = event.altKey
  stopPicker()
  cb?.onPick(asHover ? { ...resolved, action: 'hover' } : resolved)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Alt') {
    altHeld = true
    updateHint()
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    const cb = callbacks
    stopPicker()
    cb?.onCancel()
  }
}

function onKeyup(event: KeyboardEvent) {
  if (event.key === 'Alt') {
    altHeld = false
    updateHint()
  }
}

export function startPicker(next: PickerCallbacks) {
  if (active) stopPicker()
  active = true
  altHeld = false
  callbacks = next
  ensureOverlay()
  document.addEventListener('mousemove', onMove, true)
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKeydown, true)
  document.addEventListener('keyup', onKeyup, true)
}

export function stopPicker() {
  if (!active) {
    clearOverlay()
    return
  }
  active = false
  altHeld = false
  callbacks = null
  document.removeEventListener('mousemove', onMove, true)
  document.removeEventListener('click', onClick, true)
  document.removeEventListener('keydown', onKeydown, true)
  document.removeEventListener('keyup', onKeyup, true)
  clearOverlay()
}

export function isPickerActive() {
  return active
}

export function isPlaywigoIgnoreTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('[data-playwigo-ignore]'))
}
