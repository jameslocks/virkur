
import { MeditationTimer } from '../meditation-timer'

export async function Meditation(root: HTMLElement) {
    root.innerHTML = `
        <section class="space-y-4">
            <div class="flex items-center justify-between">
                <a href="#today" class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-700 border border-butter-300/20 text-butter-300 hover:bg-ink-900">← Back</a>
                <div class="text-butter-300 font-medium">Meditation Timer</div>
                <div></div>
            </div>
            <div id="meditation-timer-mount"></div>
        </section>
    `

    const timer = new MeditationTimer()
    timer.mount(root.querySelector('#meditation-timer-mount')!)
}
