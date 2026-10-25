import { m } from '#lib/paraglide/messages.js';

/** A parsed note: its spelling, diatonic step number (octave * 7 + letter) and MIDI number. */
export interface Note {
  n: string;
  dia: number;
  midi: number;
}

/** `null` is a rest. */
export type Line = (Note | null)[];

export type Species = 1 | 2;
export type Severity = 'erro' | 'aviso';

export interface Issue {
  /** Index of the offending note in the voice, or -1 for the whole voice. */
  k: number;
  s: Severity;
  /** The message, worded in the current language when called. */
  m: () => string;
}

const L7: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const B12 = [0, 2, 4, 5, 7, 9, 11];
/** Natural pitch classes to their letter. */
export const LET: Record<number, string> = {
  0: 'C',
  2: 'D',
  4: 'E',
  5: 'F',
  7: 'G',
  9: 'A',
  11: 'B'
};

/** Parse `D4`, `F#4`, `Bb3`. */
export function parse(t: string): Note | null {
  const m = /^([A-Ga-g])([#b]*)(-?\d)$/.exec(t);
  if (!m) return null;
  const l = L7[m[1].toUpperCase()];
  const a = [...m[2]].reduce((s, c) => s + (c === '#' ? 1 : -1), 0);
  const o = +m[3];
  return { n: m[1].toUpperCase() + m[2] + o, dia: o * 7 + l, midi: 12 * (o + 1) + B12[l] + a };
}

/** Split note text on spaces and commas. */
export const tokens = (s: string) =>
  s
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);

/** Parse a voice; `rest` allows `r` or `-` as a rest. Unparseable tokens are returned in `bad`. */
export function readVoice(s: string, rest: boolean) {
  const out: Line = [];
  const bad: string[] = [];
  for (const t of tokens(s)) {
    if (rest && /^(r|-)$/i.test(t)) {
      out.push(null);
      continue;
    }
    const p = parse(t);
    if (p) out.push(p);
    else bad.push(t);
  }
  return { out, bad };
}

type Consonance = 'uni' | 'oct' | 'per' | 'imp' | 'dis';

/** Classify an interval of `st` diatonic steps and `se` semitones. */
export function cls(st: number, se: number): Consonance {
  const g = st % 7;
  const c = se % 12;
  if (g === 0) return c === 0 && (st > 0 || se === 0) ? (st === 0 ? 'uni' : 'oct') : 'dis';
  if (g === 2 && (c === 3 || c === 4)) return 'imp';
  if (g === 4 && c === 7) return 'per';
  if (g === 5 && (c === 8 || c === 9)) return 'imp';
  return 'dis';
}
const isPerf = (c: Consonance | null) => c === 'uni' || c === 'oct' || c === 'per';

/** What's wrong with the melodic step a → b, if anything; `w` marks a warning. */
function leapMsg(a: Note, b: Note): { w?: 1; m: () => string } | null {
  const st = Math.abs(b.dia - a.dia);
  const se = Math.abs(b.midi - a.midi);
  const up = b.midi > a.midi;
  if (st === 0) return se ? { w: 1, m: m.ct_leap_chromatic } : null;
  if (st === 1) return se >= 1 && se <= 2 ? null : { m: m.ct_leap_second };
  if (st === 2) return se === 3 || se === 4 ? null : { m: m.ct_leap_third };
  if (st === 3) return se === 5 ? null : { m: se === 6 ? m.ct_leap_tritone : m.ct_leap_dim_fourth };
  if (st === 4) return se === 7 ? null : { m: se < 7 ? m.ct_leap_dim_fifth : m.ct_leap_aug_fifth };
  if (st === 5)
    return up && se === 8
      ? null
      : {
          m: se === 8 ? m.ct_leap_minor_sixth_down : m.ct_leap_major_sixth
        };
  if (st === 6) return { m: m.ct_leap_seventh };
  if (st === 7) return se === 12 ? null : { m: m.ct_leap_octave };
  return { m: m.ct_leap_beyond };
}

/** Check counterpoint `cp` of species `sp` against cantus firmus `cf`; `above` if cp is the upper voice. */
export function analyze(cf: Line, cp: Line, sp: Species, above: boolean): Issue[] {
  const I: Issue[] = [];
  const add = (k: number, s: Severity, msg: () => string) => I.push({ k, s, m: msg });
  const n = cf.length;
  const per = sp === 1 ? 1 : 2;
  const need = sp === 1 ? n : 2 * n - 1;

  if (n < 2) {
    add(-1, 'erro', m.ct_cf_too_short);
    return I;
  }
  if (cp.length !== need) {
    const p = { need, have: cp.length };
    add(-1, 'erro', () => (sp === 1 ? m.ct_count_1(p) : m.ct_count_2(p)));
    return I;
  }

  const cfAt = (k: number) => cf[Math.floor(k / per)]!;
  const iv = (k: number) =>
    cp[k]
      ? { st: Math.abs(cp[k].dia - cfAt(k).dia), se: Math.abs(cp[k].midi - cfAt(k).midi) }
      : null;
  const c = (k: number) => {
    const v = iv(k);
    return v ? cls(v.st, v.se) : null;
  };
  const pos = (k: number) =>
    sp === 1
      ? m.ct_pos_bar({ bar: k + 1 })
      : (k % 2 ? m.ct_pos_weak : m.ct_pos_strong)({ bar: Math.floor(k / 2) + 1 });
  const nm = (c: Consonance | null) =>
    ({
      uni: m.ct_cls_uni,
      oct: m.ct_cls_oct,
      per: m.ct_cls_per,
      imp: m.ct_cls_imp,
      dis: m.ct_cls_dis
    })[c!]();
  const strong = (k: number) => sp === 1 || k % 2 === 0;
  const idx = cp.map((_, k) => k).filter((k) => cp[k]);
  const at = (k: number) => cp[k]!;

  cp.forEach((x, k) => {
    if (!x && k > 0) add(k, 'erro', () => m.ct_rest_late({ pos: pos(k) }));
  });

  idx.forEach((k) => {
    const isAbove = at(k).midi >= cfAt(k).midi;
    if (above !== isAbove && at(k).midi !== cfAt(k).midi)
      add(k, 'aviso', () => m.ct_crossing({ pos: pos(k) }));
    if (strong(k) && c(k) === 'dis')
      add(k, 'erro', () => m.ct_strong_dissonance({ pos: pos(k), n: iv(k)!.st + 1 }));
    if (sp === 2 && !strong(k) && c(k) === 'dis') {
      const a = cp[k - 1];
      const b = cp[k + 1];
      const ok =
        a &&
        b &&
        Math.abs(at(k).dia - a.dia) === 1 &&
        Math.abs(b.dia - at(k).dia) === 1 &&
        Math.sign(at(k).dia - a.dia) === Math.sign(b.dia - at(k).dia);
      if (!ok) add(k, 'erro', () => m.ct_weak_dissonance({ pos: pos(k) }));
    }
    if (strong(k) && c(k) === 'uni' && k !== idx[0] && k !== need - 1)
      add(k, 'erro', () => m.ct_unison_inside({ pos: pos(k) }));
  });

  const k0 = idx[0];
  if (k0 !== undefined && c(k0) && !isPerf(c(k0)))
    add(k0, 'erro', () => m.ct_start_perfect({ pos: pos(k0) }));

  const last = need - 1;
  if (cp[last]) {
    const cl = c(last);
    if (cl === 'per') add(last, 'aviso', m.ct_end_fifth);
    else if (cl !== 'uni' && cl !== 'oct') add(last, 'erro', m.ct_end_perfect);
  }

  // The cadence wants a major sixth above (or minor third below) before the final note.
  const sixth = (k: number) => {
    const v = iv(k);
    return v && (above ? v.st % 7 === 5 && v.se % 12 === 9 : v.st % 7 === 2 && v.se % 12 === 3);
  };
  const want = () => (above ? m.ct_want_sixth() : m.ct_want_third());

  if (sp === 1 && n > 2 && cp[n - 2] && !sixth(n - 2))
    add(n - 2, 'aviso', () => m.ct_cadence_1({ pos: pos(n - 2), want: want() }));
  if (sp === 2 && n > 2) {
    if (cp[last - 2] && c(last - 2) !== 'per')
      add(last - 2, 'aviso', () => m.ct_cadence_2_fifth({ pos: pos(last - 2) }));
    if (cp[last - 1] && !sixth(last - 1))
      add(last - 1, 'aviso', () => m.ct_cadence_2_after({ pos: pos(last - 1), want: want() }));
  }

  // Parallel and direct motion into perfect intervals, strong beat to strong beat.
  const S = idx.filter(strong);
  for (let j = 1; j < S.length; j++) {
    const p = S[j - 1];
    const k = S[j];
    if (k - p !== per) continue;
    const d1 = Math.sign(at(k).midi - at(p).midi);
    const d2 = Math.sign(cfAt(k).midi - cfAt(p).midi);
    const kind = d1 === 0 || d2 === 0 ? 'obl' : d1 === d2 ? 'dir' : 'con';
    const ck = c(k);
    const cpv = c(p);
    if (kind !== 'dir' || !isPerf(ck)) continue;
    if (sp === 2 && cp[p + 1] && Math.abs(cp[p + 1]!.dia - at(p).dia) >= 3) continue;
    if (isPerf(cpv)) {
      const same = cpv === ck || (cpv === 'uni' && ck === 'oct') || (cpv === 'oct' && ck === 'uni');
      const what = same
        ? ck === 'per'
          ? m.ct_parallel_fifths
          : m.ct_parallel_octaves
        : m.ct_direct_perfects;
      add(k, 'erro', () => m.ct_motion({ pos: pos(k), what: what() }));
    } else if (cpv === 'imp') {
      add(k, 'erro', () => m.ct_direct_from_imperfect({ pos: pos(k), to: nm(ck) }));
    }
  }

  for (let j = 1; j < idx.length; j++) {
    const a = at(idx[j - 1]);
    const b = at(idx[j]);
    const r = leapMsg(a, b);
    const k = idx[j];
    if (r)
      add(k, r.w ? 'aviso' : 'erro', () =>
        m.ct_melodic({ pos: pos(k), from: a.n, to: b.n, what: r.m() })
      );
    if (a.midi === b.midi && sp === 2) add(k, 'aviso', () => m.ct_repeated({ pos: pos(k) }));
  }

  for (let j = 2; j < idx.length; j++) {
    const a = at(idx[j - 2]);
    const b = at(idx[j - 1]);
    const d = at(idx[j]);
    const s1 = Math.abs(b.dia - a.dia);
    const s2 = Math.abs(d.dia - b.dia);
    const same = Math.sign(b.midi - a.midi) === Math.sign(d.midi - b.midi) && b.midi !== a.midi;
    const k = idx[j];
    if (a.midi === b.midi && b.midi === d.midi && sp === 1)
      add(k, 'aviso', () => m.ct_three_same({ pos: pos(k) }));
    else if (same && s1 >= 2 && s2 >= 2) add(k, 'aviso', () => m.ct_two_leaps({ pos: pos(k) }));
    else if (same && s1 >= 3 && s2 >= 1) add(k, 'aviso', () => m.ct_uncompensated({ pos: pos(k) }));
  }

  const ms = idx.map((k) => at(k).midi);
  if (Math.max(...ms) - Math.min(...ms) > 16) add(-1, 'aviso', m.ct_range);

  return I.sort((a, b) => a.k - b.k);
}

/** Parallels between two added voices `a` and `b`, measure downbeat to downbeat. */
export function pairsCheck(
  a: Line,
  b: Line,
  sa: Species,
  sb: Species,
  la: () => string,
  lb: () => string,
  n: number,
  vb: number
): (Issue & { v: number })[] {
  const out: (Issue & { v: number })[] = [];
  const at = (r: Line, s: Species, i: number) => r[s === 1 ? i : 2 * i];
  for (let bar = 1; bar < n; bar++) {
    const p0 = at(a, sa, bar - 1);
    const p1 = at(a, sa, bar);
    const q0 = at(b, sb, bar - 1);
    const q1 = at(b, sb, bar);
    if (!p0 || !p1 || !q0 || !q1) continue;
    const d1 = Math.sign(p1.midi - p0.midi);
    const d2 = Math.sign(q1.midi - q0.midi);
    if (!d1 || d1 !== d2) continue;
    const c1 = cls(Math.abs(p1.dia - q1.dia), Math.abs(p1.midi - q1.midi));
    if (!isPerf(c1)) continue;
    const c0 = cls(Math.abs(p0.dia - q0.dia), Math.abs(p0.midi - q0.midi));
    const k = sb === 1 ? bar : 2 * bar;
    if (isPerf(c0)) {
      const same = c0 === c1 || (c0 !== 'per' && c1 !== 'per');
      const what = same
        ? c1 === 'per'
          ? m.ct_parallel_fifths
          : m.ct_parallel_octaves
        : m.ct_direct_perfects;
      out.push({
        v: vb,
        k,
        s: 'erro',
        m: () => m.ct_pair_motion({ bar: bar + 1, what: what(), a: la(), b: lb() })
      });
    } else if (c0 === 'imp') {
      out.push({
        v: vb,
        k,
        s: 'aviso',
        m: () => m.ct_pair_direct({ bar: bar + 1, a: la(), b: lb() })
      });
    }
  }
  return out;
}

/** Spell MIDI `m` on the nearest natural (exact, then one below, then one above) plus `acc`. */
export function spellNear(m: number, acc: string): string | null {
  for (const d of [0, -1, 1]) {
    const nat = m + d;
    const pc = ((nat % 12) + 12) % 12;
    if (LET[pc]) return LET[pc] + acc + (Math.floor(nat / 12) - 1);
  }
  return null;
}
