// Cancellable, pausable waits. Hiding the tab or opening a dialog cannot skip turns.
export class Timeline {
  constructor() { this.tasks = new Set(); this.paused = false; this.version = 0; }
  wait(ms) {
    return new Promise(resolve => {
      const task = { remaining: ms, resolve, timer: null, start: 0 };
      this.tasks.add(task);
      if (!this.paused) this.schedule(task);
    });
  }
  schedule(task) {
    task.start = performance.now();
    task.timer = setTimeout(() => { this.tasks.delete(task); task.resolve(true); }, task.remaining);
  }
  pause() {
    if (this.paused) return;
    this.paused = true;
    for (const task of this.tasks) {
      clearTimeout(task.timer);
      task.remaining = Math.max(0, task.remaining - (performance.now() - task.start));
    }
  }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    for (const task of this.tasks) this.schedule(task);
  }
  cancel() {
    this.version++;
    for (const task of this.tasks) { clearTimeout(task.timer); task.resolve(false); }
    this.tasks.clear(); this.paused = false;
  }
}
