export function Today(root: HTMLElement) {
  root.innerHTML = `
    <section class="space-y-3">
      <a href="#add" class="block text-center py-3 rounded-xl bg-orange text-ink font-medium">Add Activity</a>
      <div class="text-sm text-butter/80">Your recent entries will appear here.</div>
    </section>
  `
}
