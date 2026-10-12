const LOOP_URL = new URL('./assets/Audio/dream-brainmatch-loop-seamless.mp3', import.meta.url).href;

// Music starts only after a user gesture. Pausing preserves the position;
// the edited file has a short equal-power crossfade inside the track and its
// physical end/start boundary is cut at the same quiet waveform position.
export class MusicLoop {
  constructor(settings, { createAudio = src => new Audio(src) } = {}) {
    this.settings = settings;
    this.createAudio = createAudio;
    this.audio = null;
    this.activated = false;
    this.allowed = false;
    this.ducked = false;
  }

  activate() {
    this.activated = true;
    this.sync(this.allowed);
  }

  sync(allowed) {
    this.allowed = allowed;
    if (!this.activated || !this.settings.music || !allowed) {
      this.audio?.pause();
      return;
    }
    if (!this.audio) {
      this.audio = this.createAudio(LOOP_URL);
      this.audio.loop = true;
      this.audio.preload = 'auto';
      // Keep the score below narration and card cues in this memory game.
      this.audio.volume = this.ducked ? 0.025 : 0.08;
    }
    if (this.audio.paused) Promise.resolve(this.audio.play()).catch(() => {});
  }

  setDucked(ducked) {
    this.ducked = Boolean(ducked);
    if (this.audio) this.audio.volume = this.ducked ? 0.025 : 0.08;
  }
}
