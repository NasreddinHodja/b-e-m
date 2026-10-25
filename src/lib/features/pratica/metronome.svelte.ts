import { audio } from '#lib/audio/engine.svelte.js';

const BEATS = 4;
const LED_FLASH_MS = 60;
/** Taps further apart than this start a new measurement. */
const TAP_WINDOW_MS = 2000;

/** Four-beat click with an accented downbeat. Keeps running while you use other pages. */
class Metronome {
  bpm = $state(90);
  active = $state(false);
  /** The LED currently lit, or null. */
  lit = $state<number | null>(null);
  #beat = 0;
  #interval: ReturnType<typeof setInterval> | null = null;
  #lastTap: number | null = null;

  setBpm(bpm: number) {
    this.bpm = bpm;
    if (this.active) this.#restart();
  }

  toggle() {
    this.active = !this.active;
    if (this.active) this.#start();
    else this.#stop();
  }

  tap() {
    const now = Date.now();
    if (this.#lastTap && now - this.#lastTap < TAP_WINDOW_MS) {
      this.setBpm(Math.min(220, Math.max(40, Math.round(60000 / (now - this.#lastTap)))));
    }
    this.#lastTap = now;
  }

  #tick() {
    const t = audio.now();
    audio.blip(this.#beat === 0 ? 1800 : 1200, t, {
      peak: 0.28,
      attack: 0.005,
      decayEnd: 0.07,
      stopAt: 0.08
    });
    const led = this.#beat;
    this.lit = led;
    setTimeout(() => {
      if (this.lit === led) this.lit = null;
    }, LED_FLASH_MS);
    this.#beat = (this.#beat + 1) % BEATS;
  }

  #start() {
    if (this.#interval) clearInterval(this.#interval);
    this.#tick();
    this.#interval = setInterval(() => this.#tick(), 60000 / this.bpm);
  }

  #stop() {
    if (this.#interval) clearInterval(this.#interval);
    this.#interval = null;
    this.#beat = 0;
    this.lit = null;
  }

  #restart() {
    this.#stop();
    this.#start();
  }
}

export const metronome = new Metronome();
