import { audio } from '#lib/audio/engine.svelte.js';

const DEFAULT_SECS = 25 * 60;

/** Study timer. Keeps running while you use other pages. */
class Pomodoro {
  secs = $state(DEFAULT_SECS);
  /** Which cycle button is lit. */
  cycle = $state<25 | 50>(25);
  status = $state('Pronto para começar');
  running = $state(false);
  /** Set when a cycle ends; cleared only by reset (the legacy `done` class). */
  done = $state(false);
  #interval: ReturnType<typeof setInterval> | null = null;

  get display() {
    const m = Math.floor(this.secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (this.secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  setCycle(min: 25 | 50) {
    this.reset();
    this.secs = min * 60;
    this.cycle = min;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.status = 'Sessão em andamento…';
    this.#interval = setInterval(() => {
      if (this.secs <= 0) {
        clearInterval(this.#interval!);
        this.running = false;
        this.done = true;
        this.status = 'Ciclo concluído! Faça uma pausa.';
        this.#chime();
      } else {
        this.secs--;
      }
    }, 1000);
  }

  stop() {
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = null;
    }
    this.running = false;
    this.status = 'Pausado.';
  }

  reset() {
    this.stop();
    this.secs = DEFAULT_SECS;
    this.done = false;
    this.status = 'Pronto para começar';
    this.cycle = 25;
  }

  /** Three beeps, only if audio was already started (as in the legacy app). */
  #chime() {
    if (!audio.started) return;
    const t = audio.now();
    for (const d of [0, 0.35, 0.7]) {
      audio.blip(880, t + d, { peak: 0.28, decayEnd: 1.4, stopAt: 1.5 });
    }
  }
}

export const pomodoro = new Pomodoro();
