// A single full-screen cloud field clears from the board outward. The painting
// is never cut into sliding panels; the feathered opening is drawn each frame.
export function openingProgress(elapsed, duration = 1500) {
  const t = Math.max(0, Math.min(1, (elapsed - 140) / (duration - 140)));
  return 1 - (1 - t) ** 3;
}

export class CloudReveal {
  constructor(container, canvas) {
    this.container = container;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.painting = new Image();
    this.painting.src = new URL('./assets/cloud-veil-v1.png', import.meta.url).href;
    this.painting.addEventListener('load', () => {
      if (!this.container.hidden) this.draw(this.progress || 0);
    });
    this.frame = 0;
    this.progress = 0;
  }

  cancel() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.container.hidden = true;
    this.container.style.opacity = '';
  }

  start(focus, done) {
    this.cancel();
    this.container.hidden = false;
    this.progress = 0;
    const started = performance.now();
    const duration = 1500;
    const tick = now => {
      const elapsed = now - started;
      this.progress = openingProgress(elapsed, duration);
      this.draw(this.progress, focus);
      this.container.style.opacity = elapsed > 1260 ? String(Math.max(0, (duration - elapsed) / 240)) : '1';
      if (elapsed >= duration) {
        this.cancel();
        done?.();
      } else {
        this.frame = requestAnimationFrame(tick);
      }
    };
    this.draw(0, focus);
    this.frame = requestAnimationFrame(tick);
  }

  draw(progress, focus = this.focus) {
    if (!this.context) return;
    this.focus = focus;
    const width = innerWidth, height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    if (this.canvas.width !== Math.round(width * ratio) || this.canvas.height !== Math.round(height * ratio)) {
      this.canvas.width = Math.round(width * ratio);
      this.canvas.height = Math.round(height * ratio);
    }
    const ctx = this.context;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f7f3ff';
    ctx.fillRect(0, 0, width, height);
    if (this.painting.complete && this.painting.naturalWidth) {
      const image = this.painting;
      const zoom = 1.09 - progress * .09;
      const scale = Math.max(width / image.width, height / image.height) * zoom;
      const drawnWidth = image.width * scale, drawnHeight = image.height * scale;
      ctx.drawImage(image, (width - drawnWidth) / 2 + progress * 10, (height - drawnHeight) / 2 - progress * 12, drawnWidth, drawnHeight);
    }
    if (progress <= 0) return;
    const x = focus?.x ?? width / 2, y = focus?.y ?? height / 2;
    const farthest = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    const radius = progress * farthest * 1.28;
    const feather = Math.max(52, Math.min(width, height) * .15);
    const hole = ctx.createRadialGradient(x, y, Math.max(0, radius - feather), x, y, radius + feather);
    hole.addColorStop(0, '#000');
    hole.addColorStop(1, '#0000');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = hole;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }
}
