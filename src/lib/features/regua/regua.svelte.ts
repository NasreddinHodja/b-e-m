import { audio } from '#lib/audio/engine.svelte.js';
import { midiToFreq } from '#lib/music/pitch.js';
import { SvelteSet } from 'svelte/reactivity';
import { REFERENCES, REGUA, type ReguaInterval } from './intervals.js';

/** How long a row stays lit after it is played. */
const PLAYING_MS = 2800;
/** Gap between intervals in "play all". */
const PLAY_ALL_STEP_MS = 2900;

/** The interval ruler: plays root then interval, lights the row. Survives navigation. */
class Regua {
  reference = $state(REFERENCES[0]);
  /** Indices of rows currently lit. */
  playing = new SvelteSet<number>();
  /** The last interval played, shown in the hint bar. */
  last = $state<ReguaInterval | null>(null);
  #playAllTimer: ReturnType<typeof setTimeout> | null = null;

  play(idx: number) {
    const iv = REGUA[idx];
    if (!iv) return;
    const t = audio.now();
    const root = this.reference.midi;
    audio.playNote(midiToFreq(root), t, 1.2);
    audio.playNote(midiToFreq(root + iv.semitones), t + 1.3, 1.2);
    this.playing.clear();
    this.playing.add(idx);
    this.last = iv;
    setTimeout(() => this.playing.delete(idx), PLAYING_MS);
  }

  /** Plays every interval in turn; calling again while running stops it. */
  togglePlayAll() {
    if (this.#playAllTimer) {
      clearTimeout(this.#playAllTimer);
      this.#playAllTimer = null;
      return;
    }
    let idx = 0;
    const next = () => {
      if (idx >= REGUA.length) {
        this.#playAllTimer = null;
        return;
      }
      this.play(idx++);
      this.#playAllTimer = setTimeout(next, PLAY_ALL_STEP_MS);
    };
    next();
  }
}

export const regua = new Regua();
