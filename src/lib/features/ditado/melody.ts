import { TESSITURA_HIGH, TESSITURA_LOW } from './theory.js';

export type Motion = 'step' | 'mixed' | 'leap';
export type Contour = 'mixed' | 'asc' | 'desc' | 'arch' | 'wave';
export type Focus = 'scale' | 'tonic' | 'thirds' | 'fourths' | 'chromatic';
export type Transform = 'original' | 'retrograde' | 'inversion' | 'retro-inv';

const mod12 = (v: number) => ((v % 12) + 12) % 12;

/** Offsets from the tonic (`baseMidi`) of every scale note inside the tessitura, ascending. */
function buildPitchPool(scale: readonly number[], baseMidi: number, chromatic: boolean): number[] {
  const pool: number[] = [];
  const seen = new Set<number>();
  const add = (v: number) => {
    const midi = baseMidi + v;
    if (midi < TESSITURA_LOW || midi > TESSITURA_HIGH) return;
    if (seen.has(v)) return;
    seen.add(v);
    pool.push(v);
  };
  for (let oct = -2; oct <= 2; oct++) for (const k of scale) add(k + 12 * oct);
  if (chromatic) {
    for (const v of pool.slice()) {
      add(v + 1);
      add(v - 1);
    }
  }
  pool.sort((a, b) => a - b);
  return pool;
}

/** The pool offset closest to scale degree `deg` in its own octave. */
function nearestPoolOffset(deg: number, scale: readonly number[], pool: number[]): number {
  const targetPc = mod12(scale[deg % scale.length]);
  const targetVal = scale[deg % scale.length];
  let best: number | null = null;
  let bestDist = Infinity;
  for (const v of pool) {
    if (mod12(v) !== targetPc) continue;
    const d = Math.abs(v - targetVal);
    if (d < bestDist) {
      bestDist = d;
      best = v;
    }
  }
  return best !== null ? best : pool[0];
}

/** Position of `v` counted in scale steps, or null if it is not a scale note. */
function scaleIndexOf(v: number, scale: readonly number[]): number | null {
  const k = scale.indexOf(mod12(v));
  if (k < 0) return null;
  return Math.floor(v / 12) * scale.length + k;
}

export interface MelodyOptions {
  slotCount: number;
  scale: readonly number[];
  startDeg: number;
  endDeg: number;
  range: number;
  maxLeap: number;
  motion: Motion;
  contour: Contour;
  focus: Focus;
  baseMidi: number;
}

/**
 * One random walk through the pitch pool under the given constraints, as offsets from the tonic.
 * Returns null when the walk gets stuck; callers retry.
 */
export function candidateSequence(o: MelodyOptions): number[] | null {
  const { slotCount, scale, range, maxLeap, motion, contour } = o;
  const focus = o.focus || 'scale';
  const pitchPool = buildPitchPool(scale, o.baseMidi, focus === 'chromatic');
  if (!pitchPool.length) return null;
  const seq = [nearestPoolOffset(o.startDeg, scale, pitchPool)];
  let direction = 0;
  for (let i = 1; i < slotCount; i++) {
    const choices: number[] = [];
    const iPrev = scaleIndexOf(seq[i - 1], scale);
    for (const v of pitchPool) {
      const d = v - seq[i - 1];
      if (d === 0 || Math.abs(d) > range) continue;
      const iNew = scaleIndexOf(v, scale);
      if (iPrev !== null && iNew !== null) {
        const stepSize = Math.abs(iNew - iPrev);
        if (motion === 'step' && stepSize > 1) continue;
        if (motion === 'leap' && stepSize < 2) continue;
      } else {
        if (motion === 'step' && Math.abs(d) > 2) continue;
        if (motion === 'leap' && Math.abs(d) < 2) continue;
      }
      if (focus === 'thirds' && ![3, 4].includes(Math.abs(d))) continue;
      if (focus === 'fourths' && ![5, 7].includes(Math.abs(d))) continue;
      if (focus === 'tonic') {
        const pitchClass = mod12(v);
        const isTonic = scale.indexOf(pitchClass) === 0;
        const isDominant = scale.indexOf(pitchClass) === (scale.length >= 5 ? 4 : 3);
        if (!isTonic && !isDominant && Math.random() < 0.75) continue;
      }
      if (contour === 'asc' && d < 0) continue;
      if (contour === 'desc' && d > 0) continue;
      if (contour === 'arch' && i < slotCount / 2 && d < 0) continue;
      if (contour === 'arch' && i >= slotCount / 2 && d > 0) continue;
      if (contour === 'wave' && direction !== 0 && Math.sign(d) === direction) continue;
      if (Math.abs(d) > maxLeap) continue;
      choices.push(v);
    }
    if (!choices.length) return null;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    direction = Math.sign(pick - seq[i - 1]);
    seq.push(pick);
  }
  const finalTarget = nearestPoolOffset(o.endDeg, scale, pitchPool);
  // The leap into the final tonic is from the note before it. (The legacy page measured it from
  // the note being replaced, so the last leap could exceed maxLeap.)
  if (seq.length > 1 && Math.abs(finalTarget - seq[seq.length - 2]) > maxLeap) return null;
  seq[seq.length - 1] = finalTarget;
  if (Math.max(...seq) - Math.min(...seq) > range) return null;
  return seq;
}

export function parsePattern(s: string): number[] {
  return s
    .trim()
    .split(/[,\s]+/)
    .map(Number)
    .filter((x) => Number.isFinite(x) && x !== 0);
}

export interface SlonimskyOptions {
  pattern: string;
  /** Raw input value; parsed like the legacy `parseInt(...) || 1`. */
  reps: string;
  transform: Transform;
  targetCount: number;
  baseMidi: number;
}

/**
 * A Slonimsky pattern repeated and transformed, stretched or cut to `targetCount` notes and
 * shifted to a random position inside the tessitura.
 */
export function slonimskySequence(o: SlonimskyOptions): number[] | null {
  const p = parsePattern(o.pattern);
  if (!p.length) return null;
  const reps = Math.max(1, parseInt(o.reps) || 1);
  const step = p.reduce((a, b) => a + b, 0);
  let a = [0];
  for (let r = 0; r < reps; r++) {
    let cur = r * step;
    for (const d of p) {
      cur += d;
      a.push(cur);
    }
  }
  const tr = o.transform;
  if (tr === 'retrograde') a.reverse();
  if (tr === 'inversion') a = a.map((x) => -x);
  if (tr === 'retro-inv') a = a.map((x) => -x).reverse();
  const n = o.targetCount;
  if (Number.isFinite(n) && n > 0) {
    if (a.length > n) a = a.slice(0, n);
    else if (a.length < n) {
      const base = a.slice();
      let i = 0;
      while (a.length < n) a.push(base[i++ % base.length]);
    }
  }
  const loOff = TESSITURA_LOW - o.baseMidi;
  const hiOff = TESSITURA_HIGH - o.baseMidi;
  const seqMin = Math.min(...a);
  const seqMax = Math.max(...a);
  const shiftLo = loOff - seqMin;
  const shiftHi = hiOff - seqMax;
  if (shiftHi < shiftLo) {
    // Too wide to fit: center it and clamp.
    const center = Math.round((loOff + hiOff - seqMin - seqMax) / 2);
    return a.map((x) => Math.max(loOff, Math.min(hiOff, x + center)));
  }
  const shift = shiftLo + Math.floor(Math.random() * (shiftHi - shiftLo + 1));
  return a.map((x) => x + shift);
}

/** The correct answer plus up to three variants with one inner note nudged by a semitone. */
export function distractors(correct: number[]): string[] {
  const out = [correct.join(',')];
  for (let z = 0; z < 100 && out.length < 4; z++) {
    const f = correct.slice();
    const pos = 1 + Math.floor(Math.random() * Math.max(1, correct.length - 2));
    f[pos] += Math.random() < 0.5 ? 1 : -1;
    const s = f.join(',');
    if (!out.includes(s)) out.push(s);
  }
  return out;
}
