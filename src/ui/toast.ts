export function showUndoToast(message: string, onUndo: () => void, duration = 5000) {
  const bar = document.createElement('div')
  bar.className = 'fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md m-4 p-3 rounded-xl bg-amber text-ink shadow-lg flex items-center justify-between gap-3'
  bar.innerHTML = `
    <span class="text-sm">${escapeHtml(message)}</span>
    <button class="px-3 py-1 rounded bg-ink text-butter text-sm">Undo</button>
  `
  const btn = bar.querySelector('button')!
  let undone = false
  btn.onclick = () => { undone = true; onUndo(); document.body.removeChild(bar) }
  document.body.appendChild(bar)
  setTimeout(() => { if (!undone && bar.parentNode) document.body.removeChild(bar) }, duration)
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}
