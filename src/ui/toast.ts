export function showUndoToast(message: string, onUndo: () => void, duration = 5000) {
  const bar = document.createElement('div')
  bar.setAttribute('role', 'status')
  bar.setAttribute('aria-live', 'polite')
  // Positioned above bottom nav; centered; safe-area aware; high z-index
  bar.className = [
    'fixed left-1/2 -translate-x-1/2 bottom-24 z-[60]',
    'w-[calc(100%-2rem)] max-w-md',
    'px-3 py-3 rounded-xl bg-amber text-ink shadow-lg',
    'flex items-center justify-between gap-3',
    'pb-[env(safe-area-inset-bottom)]'
  ].join(' ')
  bar.innerHTML = `
    <span class="text-sm">${escapeHtml(message)}</span>
    <button class="px-3 py-1 rounded bg-ink text-butter text-sm">Undo</button>
  `
  const btn = bar.querySelector('button')!
  let undone = false
  btn.onclick = () => { undone = true; onUndo(); remove(bar) }
  document.body.appendChild(bar)
  setTimeout(() => { if (!undone) remove(bar) }, duration)
}

function remove(el: HTMLElement) {
  if (el.parentNode) el.parentNode.removeChild(el)
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}
