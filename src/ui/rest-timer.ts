
export class RestTimer {
  private root: HTMLElement | null = null;
  private intervalId: number | undefined;
  private remaining: number | null = null;

  // Singleton instance
  static readonly instance = new RestTimer();

  mount(el: HTMLElement | null) {
    if (!el) return;
    this.root = el;
    // Reset on mount so we start fresh when entering the screen
    this.reset();
  }

  private reset() {
    this.stop();
    this.remaining = null;
    this.render();
  }

  private stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private start(seconds: number) {
    this.stop();
    this.remaining = seconds;
    this.render();

    this.intervalId = window.setInterval(() => {
      if (this.remaining !== null) {
        this.remaining--;
        if (this.remaining <= 0) {
          this.finish();
        } else {
          this.render();
        }
      }
    }, 1000);
  }

  private finish() {
    this.stop();
    this.remaining = 0; // 0 indicates finished/ "Let's go!"
    this.render();

    // Show "Let's go!" for 3 seconds then revert to idle
    setTimeout(() => {
      // Only reset if we are still in the finished state (effectively debouncing if user clicked something else, though UI blocks it)
      if (this.remaining === 0) {
        this.reset();
      }
    }, 3000);
  }

  private render() {
    if (!this.root) return;

    // Clear current content
    this.root.innerHTML = '';

    const container = document.createElement('div');
    
    if (this.remaining === null) {
      // Idle: 3 buttons
      container.className = 'grid grid-cols-3 gap-2 mb-4';
      [30, 60, 90].forEach(sec => {
        const btn = document.createElement('button');
        btn.textContent = `${sec}s`;
        btn.className = 'py-1 px-3 bg-ink-700 hover:bg-ink-900 border border-butter-300/20 rounded text-xs font-medium text-butter-300 transition-colors cursor-pointer';
        btn.onclick = () => this.start(sec);
        container.appendChild(btn);
      });
    } else if (this.remaining > 0) {
      // Counting
      container.className = 'mb-4 py-1.5 px-3 bg-ink-700 border border-butter-300/20 rounded text-center cursor-pointer hover:bg-ink-900 transition-colors';
      container.onclick = () => this.reset(); // Allow cancel
      container.title = 'Tap to cancel';
      
      const text = document.createElement('span');
      text.className = 'text-sm font-mono text-butter-300';
      text.textContent = `Resting: ${this.remaining}s`;
      container.appendChild(text);
    } else {
      // Finished (remaining === 0)
      container.className = 'mb-4 py-1.5 px-3 bg-mint-500 border border-mint-500 rounded text-center';
      
      const text = document.createElement('span');
      text.className = 'text-sm font-bold text-ink-900';
      text.textContent = "Let's go!";
      container.appendChild(text);
    }

    this.root.appendChild(container);
  }
}
