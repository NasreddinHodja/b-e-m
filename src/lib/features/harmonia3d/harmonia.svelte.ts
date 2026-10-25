import { audio } from '#lib/audio/engine.svelte.js';
import { midiToFreq } from '#lib/music/pitch.js';
import {
  FIELDS,
  MAX_EVENTS,
  PRESETS,
  RELATIVE,
  SCALE,
  colorKey,
  pcOf,
  spellScale,
  type FieldKey
} from './fields.js';

export type ViewName = 'front' | 'diag' | 'side' | 'top';

/** Camera orbit angles [theta, phi] of each named view. */
export const VIEWS: Record<ViewName, [number, number]> = {
  front: [0, Math.PI / 2],
  diag: [0.85, 1.2],
  side: [Math.PI / 2, Math.PI / 2],
  top: [0, 0.25]
};

export interface ProgEvent {
  /** Degree index. */
  d: number;
  /** Length in beats. */
  b: number;
}

/** How long a clicked chord stays highlighted. */
const FLASH_MS = 1500;

/**
 * Harmonia 3D: the progression and its playback, plus the camera, which the 3D scene reads every
 * frame. Kept across navigation, as the legacy tab kept it.
 */
class Harmonia {
  field = $state<FieldKey>('maj');
  tonic = $state('C');
  tetra = $state(false);
  prog = $state<ProgEvent[]>([]);
  /** Beats for the next clicked chord. */
  dur = $state(4);
  bpm = $state(90);
  /** Event highlighted in the scene, -1 for none. */
  active = $state(-1);
  showMeasures = $state(true);
  preset = $state('0');
  view = $state<ViewName>('diag');
  playing = $state(false);

  names = $derived(spellScale(this.tonic, this.field));
  degrees = $derived(FIELDS[this.field].deg);
  timeline = $derived.by(() => {
    let t = 0;
    const evs = this.prog.map((e) => {
      const o = { d: e.d, b: e.b, t0: t, t1: t + e.b };
      t += e.b;
      return o;
    });
    return { evs, total: t };
  });

  // Read by the scene every frame; not reactive.
  /** Seventh-leg growth, animated toward `t7Goal`. */
  t7 = 0;
  t7Goal = 0;
  playT0 = 0;
  lastEv = -1;
  /** The scene must rebuild its geometry. */
  dirty = true;
  /** The scene must refit the camera distance. */
  needsFit = false;
  userZoomed = false;
  cam = { theta: 0.85, phi: 1.2, dist: 60 };
  goal = { theta: 0.85, phi: 1.2, dist: 60 };
  pan = { x: 0, y: 0, z: 0 };
  /** The scene has been shown once (the camera starts at its fitted distance). */
  started = false;
  #flashTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.setProg(PRESETS[0].seq, false);
  }

  get reducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  chordName(i: number) {
    const d = this.degrees[i];
    return this.names[i] + (this.tetra ? d.tet : d.tri === 'M' ? '' : d.tri === 'm' ? 'm' : 'dim');
  }

  colorOf(i: number) {
    return colorKey(this.degrees[i], this.tetra);
  }

  presetLabel(i: number) {
    const p = PRESETS[i];
    return (
      p.seq.map((x) => FIELDS[this.field].roman[x[0]]).join(' – ') + (p.note ? ` (${p.note})` : '')
    );
  }

  playChord(i: number, dur?: number) {
    try {
      const d = this.degrees[i];
      const semis = [0, d.v, d.v + d.h];
      if (this.tetra) semis.push(d.v + d.h + d.s);
      const root = 60 + ((pcOf(this.tonic) + SCALE[this.field][i]) % 12);
      const t = audio.now();
      const len = Math.max(1.0, dur || 1.1);
      semis.forEach((s, n) => audio.playNote(midiToFreq(root + s), t + n * 0.04, len));
    } catch {
      // No audio available: the scene still works.
    }
  }

  setTetra(on: boolean) {
    this.tetra = on;
    this.t7Goal = on ? 1 : 0;
    if (this.reducedMotion) this.t7 = this.t7Goal;
    this.dirty = true;
  }

  setField(f: FieldKey) {
    if (f === this.field) return;
    if (this.playing) this.stopPlay();
    const from = this.field;
    this.field = f;
    this.tonic = RELATIVE[from][this.tonic] || FIELDS[f].tonics[0];
    this.dirty = true;
  }

  setTonic(t: string) {
    this.tonic = t;
    this.dirty = true;
  }

  /** From the preset select. Choosing "Personalizada" changes nothing. */
  choosePreset(value: string) {
    this.preset = value;
    if (value === 'c') return;
    if (this.playing) this.stopPlay();
    this.setProg(PRESETS[+value].seq, false);
  }

  setProg(seq: [number, number][], custom: boolean) {
    this.prog = seq.map(([d, b]) => ({ d, b }));
    const key = JSON.stringify(seq);
    const i = PRESETS.findIndex((p) => JSON.stringify(p.seq) === key);
    this.preset = !custom && i >= 0 ? String(i) : 'c';
    this.dirty = true;
  }

  /** A degree button: hear it and append it to the progression. */
  addChord(i: number) {
    if (this.playing) this.stopPlay();
    if (this.prog.length >= MAX_EVENTS) {
      this.playChord(i, 1.0);
      return;
    }
    this.prog.push({ d: i, b: this.dur });
    this.preset = 'c';
    this.dirty = true;
    this.playChord(i, 1.0);
    this.#flash(this.prog.length - 1);
  }

  undo() {
    if (this.playing) this.stopPlay();
    this.prog = this.prog.slice(0, -1);
    this.preset = 'c';
    this.dirty = true;
  }

  clear() {
    if (this.playing) this.stopPlay();
    this.prog = [];
    this.preset = 'c';
    this.dirty = true;
  }

  #flash(k: number) {
    this.active = k;
    this.dirty = true;
    clearTimeout(this.#flashTimer);
    this.#flashTimer = setTimeout(() => {
      if (!this.playing) {
        this.active = -1;
        this.dirty = true;
      }
    }, FLASH_MS);
  }

  togglePlay() {
    if (this.playing) {
      this.stopPlay();
      return;
    }
    if (!this.prog.length) return;
    this.playing = true;
    this.playT0 = performance.now();
    this.lastEv = -1;
  }

  stopPlay() {
    this.playing = false;
    this.active = -1;
    this.lastEv = -1;
    this.dirty = true;
  }

  /** Change tempo; while playing, keep the current beat position. */
  setBpm(v: number) {
    if (this.playing) {
      const beat = (((performance.now() - this.playT0) / 1000) * this.bpm) / 60;
      this.playT0 = performance.now() - (beat / (v / 60)) * 1000;
    }
    this.bpm = v;
  }

  setShowMeasures(on: boolean) {
    this.showMeasures = on;
    this.dirty = true;
  }

  setView(name: ViewName) {
    const [theta, phi] = VIEWS[name];
    this.goal.theta = theta;
    this.goal.phi = phi;
    this.pan = { x: 0, y: 0, z: 0 };
    this.userZoomed = false;
    this.needsFit = true;
    this.view = name;
  }
}

export const harmonia = new Harmonia();
