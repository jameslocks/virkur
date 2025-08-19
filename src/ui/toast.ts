/**
 * Show a toast. Only one is visible at a time.
 * - message: main text
 * - action: optional button { label, onClick }
 * - duration: ms before auto-dismiss (default 5000). Set 0 to require manual dismiss.
 */
export function showToast(
  message: string,
  opts: { action?: { label: string; onClick: () => void }, duration?: number } = {}
) {
  // Remove any existing toast (single-instance UX)
  const existing = document.getElementById('app-toast')
  if (existing) existing.remove()

  const { action, duration = 5000 } = opts

  const bar = document.createElement('div')
  bar.id = 'app-toast'
  bar.setAttribute('role', 'status')
  bar.setAttribute('aria-live', 'polite')
  bar.setAttribute('aria-atomic', 'true')

  // Position above bottom nav; comfy padding; centered layout
  bar.className = [
    'fixed left-1/2 -translate-x-1/2 bottom-24 z-[60]',
    'w-[calc(100%-2rem)] max-w-md',
    'px-4 py-3 rounded-2xl bg-ink-700 border border-butter-300/20 shadow-lg',
    'flex items-center justify-between gap-3 text-butter-300'
  ].join(' ')

  const text = document.createElement('div')
  text.className = 'text-sm leading-5'
  text.textContent = message

  const right = document.createElement('div')
  right.className = 'flex items-center gap-2'

  // Optional action button (e.g., Undo / Refresh)
  let actionClicked = false
  if (action) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'px-3 py-1.5 rounded-xl bg-amber text-ink font-medium text-sm'
    btn.textContent = action.label
    btn.addEventListener('click', () => {
      actionClicked = true
      try { action.onClick() } finally { remove(bar) }
    })
    right.appendChild(btn)
  }

  // Dismiss button
  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'px-3 py-1.5 rounded-xl bg-ink-900 border border-butter-300/20 text-butter-300 text-sm'
  close.textContent = 'Dismiss'
  close.addEventListener('click', () => remove(bar))
  right.appendChild(close)

  // Build DOM
  bar.appendChild(text)
  bar.appendChild(right)
  document.body.appendChild(bar)

  // Trap: allow ESC to close while focused anywhere
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') remove(bar)
  }
  window.addEventListener('keydown', escHandler, { once: true })

  // Auto-dismiss (unless duration = 0)
  if (duration > 0) {
    setTimeout(() => {
      if (!actionClicked) remove(bar)
    }, duration)
  }
}

/** Convenience helper for the common Undo pattern */
export function showUndoToast(message: string, onUndo: () => void, duration = 5000) {
  showToast(message, { action: { label: 'Undo', onClick: onUndo }, duration })
}

/* --------- helpers ---------- */

function remove(el: HTMLElement) {
  if (!el.isConnected) return
  el.remove()
}
