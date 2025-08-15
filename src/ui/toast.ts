export function showUndoToast(message: string, onUndo: () => void, duration = 5000) {
  const bar = document.createElement('div')
  bar.setAttribute('role', 'status')
  bar.setAttribute('aria-live', 'polite')

  // Center contents vertically with equal y-padding; position above bottom nav
  bar.className = [
    'fixed left-1/2 -translate-x-1/2 bottom-24 z-[60]',
    'w-[calc(100%-2rem)] max-w-md',
    'px-4 py-3 rounded-2xl bg-amber text-ink shadow-lg',
    'flex items-center justify-between gap-4' // <— aligns text + button vertically
  ].join(' ')

  bar.innerHTML = `
    <span class="text-sm leading-5">${escapeHtml(message)}</span>
    <button class="px-3 py-1.5 rounded-lg bg-ink text-butter text-sm">Undo</button>
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
