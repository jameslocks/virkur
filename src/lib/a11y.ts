/**
 * Installs small, app-wide accessibility helpers:
 * - Adds a “Skip to content” link that targets #app
 * - Ensures #app is focusable (tabindex=-1) and role="main"
 * - Keeps `aria-current="page"` in sync on <nav> links
 * - Injects tiny CSS to style the skip link and prevent iOS input auto-zoom
 */
export function installA11y() {
  // Ensure main region is identifiable & focusable
  const app = document.getElementById('app')
  if (app) {
    app.setAttribute('role', 'main')
    if (!app.hasAttribute('tabindex')) app.setAttribute('tabindex', '-1')
  }

  // Add skip link once at top of <body>
  if (!document.getElementById('skip-to-content')) {
    const a = document.createElement('a')
    a.id = 'skip-to-content'
    a.href = '#app'
    a.textContent = 'Skip to content'
    a.className =
      'fixed left-3 top-3 z-[100] -translate-y-16 focus:translate-y-0 ' +
      'transition-transform px-3 py-2 rounded-lg bg-amber text-ink font-medium ' +
      'shadow focus-ring'
    document.body.prepend(a)
  }

  // Inject tiny CSS for skip link and iOS input zoom avoidance (16px)
  if (!document.getElementById('a11y-style')) {
    const style = document.createElement('style')
    style.id = 'a11y-style'
    style.textContent = `
      :where(input, select, textarea){ font-size:16px; } /* prevent iOS auto-zoom */
      html{ touch-action: manipulation; } /* reduce double-tap zoom on buttons/links */
    `
    document.head.appendChild(style)
  }

  // Keep aria-current on nav links that use hash routing
  const syncAriaCurrent = () => {
    const current = (location.hash || '#today')
    document.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"]').forEach(a => {
      const isCurrent = a.getAttribute('href') === current
      if (isCurrent) a.setAttribute('aria-current', 'page')
      else a.removeAttribute('aria-current')
    })
  }
  window.addEventListener('hashchange', syncAriaCurrent)
  window.addEventListener('DOMContentLoaded', syncAriaCurrent)
  syncAriaCurrent()
}
