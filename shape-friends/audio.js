// Approved cheerful/encouraging local recordings. Keys remain the exact
// caption text used by gameplay; values are URLs relative to this module.
const DIALOGUE_ROOT = 'assets/shapepairssparkydialogues/';
export const VOICE_CLIPS = {
  "Welcome to practice! Pick any two cards!": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingwelco_20260929 (1).mp3`,
  "Ready to play against me? You go first!": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingready_20260929 (1).mp3`,
  "Oh, brilliant! You spotted another shape pair!": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingoh-br_20260929.mp3`,
  "Those aren’t a pair, but we’ll remember them.": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingthose_20260929.mp3`,
  "Not a pair yet. Now we know both cards.": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingnot-a_20260929.mp3`,
  "Oops, I missed that pair. Your turn!": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingoops-_20260929.mp3`,
  "You found more pairs than me! Wonderful playing!": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingyou-f_20260929.mp3`,
  "I found more this time. Want another round?": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingi-fou_20260929 (1).mp3`,
  "It’s a tie! We remembered together.": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingits-a_20260929.mp3`,
  "Every pair is found. You did it!": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingevery_20260929.mp3`,
  "I found a pair! My memory worked!": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingi-fou_20260929.mp3`,
  "I remember seeing those two. Try them!": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingi-rem_20260929.mp3`,
  "I’m still learning too. Let’s turn another card.": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingim-st_20260929.mp3`,
  "Welcome, friend! Let’s find shape pairs together.": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingwelco_20260929.mp3`,
  "Your turn! Which two cards will you try?": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingyour-_20260929.mp3`,
  "My turn! Let me think... I’ll try this one.": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingmy-tu_20260929.mp3`,
  "These two belong together! What a lovely pair.": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingthese_20260929.mp3`,
  "A new board! You get the first pick.": `${DIALOGUE_ROOT}pw_asset_cheerful-encouraginga-new_20260929.mp3`,
  "Hi, friend! Ready to find some shape pairs?": `${DIALOGUE_ROOT}pw_asset_cheerful-encouraginghi-fr_20260929.mp3`,
  "We’re back! Let’s see what we remember.": `${DIALOGUE_ROOT}pw_asset_cheerful-encouragingwere-_20260929.mp3`,
  "Let’s find a shape pair for our picnic!": `${DIALOGUE_ROOT}pw_asset_cheerful-encouraginglets-_20260929 (1).mp3`
};
// Measured from the shipped MP3 waveforms. These are real quiet sections,
// not guessed punctuation pauses, and keep the mouth closed between phrases.
export const VOICE_TIMING = Object.freeze({
  "Welcome to practice! Pick any two cards!": [[1207,1435],[3397,3600]],
  "Ready to play against me? You go first!": [[1520,1981]],
  "Oh, brilliant! You spotted another shape pair!": [],
  "Those aren’t a pair, but we’ll remember them.": [[1381,1603],[1960,2081]],
  "Not a pair yet. Now we know both cards.": [[0,173],[1256,1554]],
  "Oops, I missed that pair. Your turn!": [[1630,2057]],
  "You found more pairs than me! Wonderful playing!": [[2152,2385],[3994,4157]],
  "I found more this time. Want another round?": [[0,215],[1466,1603]],
  "It’s a tie! We remembered together.": [[935,1199]],
  "Every pair is found. You did it!": [[0,123]],
  "I found a pair! My memory worked!": [[0,396],[1263,1654]],
  "I remember seeing those two. Try them!": [[1690,2022]],
  "I’m still learning too. Let’s turn another card.": [[1387,1995]],
  "Welcome, friend! Let’s find shape pairs together.": [[1217,1546],[3782,4000]],
  "Your turn! Which two cards will you try?": [[746,1262]],
  "My turn! Let me think... I’ll try this one.": [[979,1327],[2547,3579]],
  "These two belong together! What a lovely pair.": [],
  "A new board! You get the first pick.": [[1103,1492]],
  "Hi, friend! Ready to find some shape pairs?": [[0,138],[762,1059]],
  "We’re back! Let’s see what we remember.": [[2685,2870]],
  "Let’s find a shape pair for our picnic!": [[1192,1316]],
});
export const EFFECT_CLIPS = {};

export class GameAudio {
  constructor(settings, { engine = globalThis.speechSynthesis, clips = VOICE_CLIPS, createAudio = src => new Audio(src), utterance = text => new SpeechSynthesisUtterance(text), deviceFallback = false } = {}) {
    this.settings = settings; this.engine = engine; this.clips = clips;
    this.createAudio = createAudio; this.utterance = utterance;
    this.context = null; this.clip = null; this.generation = 0; this.finishSpeech = null; this.deviceFallback = deviceFallback;
  }
  unlock() { try { this.context ||= new AudioContext(); this.context.resume().catch(() => {}); } catch {} }
  remainingMs() { return this.settings.voice && this.clip && !this.clip.paused && Number.isFinite(this.clip.duration) ? Math.max(0, Math.min(4000, (this.clip.duration-this.clip.currentTime)*1000)) : 0; }
  stop() {
    const finish=this.finishSpeech,clip=this.clip;
    this.finishSpeech=null;this.generation++;
    try { this.engine?.cancel(); clip?.pause(); } catch {}
    this.clip=null;finish?.();
  }
  say(text, {onStart=()=>{},onEnd=()=>{}}={}) {
    this.stop();
    let settle,signalStart,startSettled=false;
    const completion=new Promise(resolve=>{settle=resolve;});
    completion.started=new Promise(resolve=>{signalStart=resolve;});
    if (!this.settings.voice) { signalStart(null);settle({started:false,reason:'muted'}); return completion; }
    const generation = this.generation;
    let attempted = false, active = false, finished = false, clip = null;
    const begin = () => {
      if(active||finished||generation!==this.generation||!this.settings.voice)return;
      active=true;
      const measured=Number(clip?.duration)*1000;
      const fallbackDuration=Math.max(700,text.length*72),startedAt=performance.now();
      const meta={
        durationMs:Number.isFinite(measured)&&measured>0?measured:fallbackDuration,
        silences:VOICE_TIMING[text]||[],
        clock:()=>{
          const liveDuration=Number(clip?.duration)*1000,liveTime=Number(clip?.currentTime)*1000;
          return {
            currentMs:Number.isFinite(liveTime)&&liveTime>=0?liveTime:Math.max(0,performance.now()-startedAt),
            durationMs:Number.isFinite(liveDuration)&&liveDuration>0?liveDuration:fallbackDuration,
          };
        },
      };
      startSettled=true;signalStart(meta);onStart(meta);
    };
    const finish = () => {
      if(finished)return;finished=true;
      if(active)onEnd();
      if(!startSettled){startSettled=true;signalStart(null);}
      if(this.finishSpeech===finish)this.finishSpeech=null;
      if(this.clip===clip)this.clip=null;
      settle({started:active,reason:'finished'});
    };
    this.finishSpeech=finish;
    const fallback = () => {
      if (attempted || generation !== this.generation || !this.settings.voice) return;
      attempted = true;
      // The supplied Sparky recordings are the character's identity. Missing
      // optional lines stay caption-only instead of changing to a system voice.
      if (!this.deviceFallback) { finish(); return; }
      try {
        if (!this.engine) { finish(); return; }
        const line = this.utterance(text), voices = this.engine.getVoices();
        line.voice = voices.find(voice => /^en/.test(voice.lang) && /Samantha|Karen|Moira|Google.*female/i.test(voice.name)) || voices.find(voice => /^en/.test(voice.lang)) || null;
        line.lang = 'en-IN'; line.rate = .9; line.pitch = 1.12; line.volume = .85;
        line.onstart=begin;line.onend=finish;line.onerror=finish;
        this.engine.speak(line);
      } catch { finish(); /* Speech availability cannot block the game. */ }
    };
    const path = this.clips[text];
    if (!path) { fallback(); return completion; }
    try {
      clip = this.createAudio(new URL(path, import.meta.url).href);this.clip=clip;
      clip.onplay=begin;clip.onplaying=begin;clip.onended=finish;
      clip.onerror=()=>active?finish():fallback();
      Promise.resolve(clip.play()).then(begin).catch(fallback);
    } catch { fallback(); }
    return completion;
  }
  effect(kind = 'flip') {
    if (!this.settings.effects) return;
    this.unlock(); if (!this.context) return;
    const notes = { flip: [430], match: [523, 659, 784], finish: [523, 659, 784, 1047], bounce: [240, 350], party: [700, 890], pour: [350, 280, 240], chime: [880, 1174], open: [400, 530], roll: [200, 280], slide: [360], spin: [500, 700] }[kind] || [440];
    try { notes.forEach((frequency, i) => {
      const time = this.context.currentTime + i * .085, oscillator = this.context.createOscillator(), gain = this.context.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, time);
      gain.gain.setValueAtTime(.001, time); gain.gain.exponentialRampToValueAtTime(.045, time + .012); gain.gain.exponentialRampToValueAtTime(.001, time + .24);
      oscillator.connect(gain).connect(this.context.destination); oscillator.start(time); oscillator.stop(time + .25);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }); } catch {}
  }
}
