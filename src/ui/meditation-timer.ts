
import { db } from '../db'
import { nanoid } from '../util/id'
import { localYMD } from '../lib/date'
import { showUndoToast } from './toast'

export class MeditationTimer {
    private intervalId?: number
    private remaining: number = 0 // seconds
    private totalSeconds: number = 0
    private isRunning: boolean = false
    private root: HTMLElement | null = null
    private audioCtx: AudioContext | null = null

    constructor() { }

    mount(el: HTMLElement) {
        this.root = el
        this.render()
    }

    private start(minutes: number) {
        if (this.isRunning) return

        // Initialize AudioContext on user gesture
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        } else if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume()
        }

        this.totalSeconds = minutes * 60
        this.remaining = this.totalSeconds
        this.isRunning = true
        this.render()

        this.intervalId = window.setInterval(() => {
            this.remaining--
            if (this.remaining <= 0) {
                this.finish()
            } else {
                this.render()
            }
        }, 1000)
    }

    private stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = undefined
        }
        this.isRunning = false
        this.render()
    }

    private async finish() {
        this.stop()
        this.playChime()
        await this.saveEntry()
        this.render()
    }

    private async saveEntry() {
        const activities = await db.activities.toArray()
        const medAct = activities.find(a => a.name === 'Meditation')
        if (!medAct) return

        const entry = {
            id: nanoid(),
            activityId: medAct.id,
            occurredAt: localYMD(),
            metrics: {
                duration_min: Math.round(this.totalSeconds / 60)
            }
        }
        await db.entries.add(entry)
        showUndoToast('Meditation session saved', async () => {
            await db.entries.delete(entry.id)
        })
    }

    private playChime() {
        try {
            if (!this.audioCtx) return
            const ctx = this.audioCtx
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(440, ctx.currentTime) // A4
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1) // Up to A5

            gain.gain.setValueAtTime(0, ctx.currentTime)
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start()
            osc.stop(ctx.currentTime + 3)
        } catch (e) {
            console.error('Failed to play chime', e)
        }
    }

    private formatTime(sec: number) {
        const m = Math.floor(sec / 60)
        const s = sec % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    private render() {
        if (!this.root) return

        if (this.isRunning) {
            this.root.innerHTML = `
                <div class="flex flex-col items-center justify-center space-y-8 py-12">
                    <div class="text-6xl font-mono text-butter-300">${this.formatTime(this.remaining)}</div>
                    <div class="text-xl text-butter-300/60 animate-pulse">Breathe...</div>
                    <button id="cancel-meditation" class="px-8 py-3 rounded-xl bg-ink-700 border border-butter-300/20 text-butter-300 font-medium">Cancel</button>
                </div>
            `
            this.root.querySelector('#cancel-meditation')?.addEventListener('click', () => this.stop())
        } else if (this.remaining === 0 && this.totalSeconds > 0) {
            // Finished state
            this.root.innerHTML = `
                <div class="flex flex-col items-center justify-center space-y-6 py-12">
                    <div class="text-5xl text-mint-500">🙏</div>
                    <div class="text-2xl font-medium text-butter-300">Session Complete</div>
                    <p class="text-butter-300/60 text-center">Your meditation has been saved to history.</p>
                    <button id="reset-meditation" class="px-8 py-3 rounded-xl bg-amber text-ink font-medium">Done</button>
                </div>
            `
            this.root.querySelector('#reset-meditation')?.addEventListener('click', () => {
                this.remaining = 0
                this.totalSeconds = 0
                this.render()
            })
        } else {
            // Setup state
            this.root.innerHTML = `
                <div class="space-y-6 py-4">
                    <div class="grid grid-cols-3 gap-3">
                        ${[1, 5, 10, 15, 20, 30].map(m => `
                            <button class="med-btn py-4 rounded-xl bg-ink-700 border border-butter-300/20 text-butter-300 font-medium hover:bg-ink-900 transition-colors" data-mins="${m}">${m} min</button>
                        `).join('')}
                    </div>
                    <div class="flex gap-2">
                        <input id="custom-mins" type="number" placeholder="Custom" class="flex-1 p-3 rounded bg-ink-700 border border-butter-300/20 text-white" min="1" max="180" />
                        <button id="start-custom" class="px-4 py-2 rounded bg-amber text-ink font-medium">Start</button>
                    </div>
                </div>
            `
            this.root.querySelectorAll('.med-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const mins = parseInt((btn as HTMLElement).dataset.mins!)
                    this.start(mins)
                })
            })
            this.root.querySelector('#start-custom')?.addEventListener('click', () => {
                const input = this.root!.querySelector('#custom-mins') as HTMLInputElement
                const mins = parseInt(input.value)
                if (mins > 0) this.start(mins)
            })
        }
    }
}
