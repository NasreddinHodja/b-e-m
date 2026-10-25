export type Meter = '2/4' | '3/4' | '4/4' | '6/8' | '9/8' | '12/8';
export type Motor = 'basic' | 'eighth' | 'varied' | 'syncopated';

export interface MeterStruct {
  groups: number;
  /** Beat-group length in quarter notes. */
  groupDur: number;
  kind: 'simple' | 'compound';
  subdivisions: number;
  accents: number[];
}

export const METER_STRUCT: Record<Meter, MeterStruct> = {
  '2/4': { groups: 2, groupDur: 1, kind: 'simple', subdivisions: 2, accents: [1, 0] },
  '3/4': { groups: 3, groupDur: 1, kind: 'simple', subdivisions: 2, accents: [1, 0, 0] },
  '4/4': { groups: 4, groupDur: 1, kind: 'simple', subdivisions: 2, accents: [1, 0, 1, 0] },
  '6/8': { groups: 2, groupDur: 1.5, kind: 'compound', subdivisions: 3, accents: [1, 0] },
  '9/8': { groups: 3, groupDur: 1.5, kind: 'compound', subdivisions: 3, accents: [1, 0, 0] },
  '12/8': { groups: 4, groupDur: 1.5, kind: 'compound', subdivisions: 3, accents: [1, 0, 1, 0] }
};

/** Rhythm cells that fill one beat group, by meter kind and rhythm style. */
const GROUP_OPTIONS: Record<MeterStruct['kind'], Record<Motor, number[][]>> = {
  simple: {
    basic: [[1]],
    eighth: [[0.5, 0.5]],
    varied: [[1], [0.5, 0.5], [0.25, 0.25, 0.5], [0.5, 0.25, 0.25]],
    syncopated: [[1], [0.5, 0.5], [0.75, 0.25], [0.25, 0.75], [0.25, 0.5, 0.25]]
  },
  compound: {
    basic: [[1.5]],
    eighth: [[0.5, 0.5, 0.5]],
    varied: [[1.5], [0.5, 0.5, 0.5], [1, 0.5], [0.5, 1], [0.25, 0.5, 0.75], [0.75, 0.5, 0.25]],
    syncopated: [[1.5], [1, 0.5], [0.5, 1], [0.25, 0.5, 0.75], [0.75, 0.5, 0.25]]
  }
};

/** Whole-bar patterns that cross beat groups (syncopation); used half the time when present. */
const BAR_OVERRIDES: Partial<Record<Meter, Partial<Record<Motor, number[][]>>>> = {
  '4/4': {
    syncopated: [
      [0.5, 1, 0.5, 1, 1],
      [0.5, 1.5, 1, 1],
      [1, 0.5, 1.5, 1],
      [1, 1, 0.5, 1.5]
    ]
  },
  '6/8': {
    syncopated: [
      [0.5, 1.5, 0.5, 0.5],
      [0.5, 0.5, 1.5, 0.5],
      [0.5, 1, 1, 0.5]
    ]
  },
  '9/8': {
    syncopated: [
      [0.5, 1.5, 0.5, 1.5, 0.5],
      [0.5, 1, 0.5, 0.5, 1.5, 0.5]
    ]
  },
  '12/8': {
    syncopated: [
      [0.5, 1.5, 0.5, 0.5, 1.5, 0.5, 0.5, 0.5],
      [1.5, 0.5, 0.5, 1, 0.5, 0.5, 1.5]
    ]
  }
};

const almostEqual = (a: number, b: number) => Math.abs(a - b) < 1e-9;

function validPattern(pattern: number[], total: number) {
  return (
    Array.isArray(pattern) &&
    pattern.length > 0 &&
    pattern.every((d) => Number.isFinite(d) && d > 0) &&
    almostEqual(
      pattern.reduce((a, b) => a + b, 0),
      total
    )
  );
}

function rhythmPatternForBar(meter: Meter, motor: Motor): number[] {
  const S = METER_STRUCT[meter];
  const total = S.groups * S.groupDur;
  const ov = BAR_OVERRIDES[meter]?.[motor];
  if (ov && Math.random() < 0.5) {
    const cand = ov[Math.floor(Math.random() * ov.length)].slice();
    if (validPattern(cand, total)) return cand;
  }
  const opts = GROUP_OPTIONS[S.kind][motor] || GROUP_OPTIONS[S.kind].basic;
  const out: number[] = [];
  for (let g = 0; g < S.groups; g++) {
    const valid = opts.filter((p) => validPattern(p, S.groupDur));
    out.push(...valid[Math.floor(Math.random() * valid.length)]);
  }
  return out;
}

/** One list of note durations (in quarter notes) per bar. */
export function rhythmDurations(meter: Meter, motor: Motor, bars: number): number[][] {
  return Array.from({ length: bars }, () => rhythmPatternForBar(meter, motor));
}

export interface Cell {
  /** Start within the beat group, in quarter notes. */
  offset: number;
  dur: number;
  isRest: boolean;
  /** Tied from the previous cell (a note split at a group boundary). */
  tieIn: boolean;
  tieOut: boolean;
  group: number;
  /** Index of the note this cell belongs to, within the bar. */
  attackIndex: number;
}

/** Split each note at beat-group boundaries so it can be notated with ties. */
export function splitDurationsAtGroupBoundaries(durs: number[], meter: Meter): Cell[][] {
  const S = METER_STRUCT[meter];
  const groupDur = S.groupDur;
  const totalDur = S.groups * groupDur;
  const EPS = 1e-9;
  const groups: Cell[][] = Array.from({ length: S.groups }, () => []);
  let t = 0;
  durs.forEach((dur, attackIndex) => {
    const start = t;
    const end = Math.min(totalDur, t + dur);
    let cursor = start;
    while (cursor < end - EPS) {
      const group = Math.min(S.groups - 1, Math.floor((cursor + EPS) / groupDur));
      const groupStart = group * groupDur;
      const groupEnd = Math.min(totalDur, (group + 1) * groupDur);
      const cellEnd = Math.min(end, groupEnd);
      groups[group].push({
        offset: cursor - groupStart,
        dur: cellEnd - cursor,
        isRest: false,
        tieIn: cursor > start + EPS,
        tieOut: cellEnd < end - EPS,
        group,
        attackIndex
      });
      cursor = cellEnd;
    }
    t = end;
  });
  const generated = groups.reduce((s, g) => s + g.reduce((a, c) => a + c.dur, 0), 0);
  if (!almostEqual(generated, totalDur))
    throw new Error(`Ritmo inválido em ${meter}: ${generated} ≠ ${totalDur}`);
  return groups;
}

export function metricGroupsForBar(meter: Meter) {
  const S = METER_STRUCT[meter];
  return Array.from({ length: S.groups }, (_, g) => ({
    index: g,
    start: g * S.groupDur,
    duration: S.groupDur,
    accent: S.accents[g]
  }));
}

export function lilyDuration(b: number): string {
  return b === 0.25
    ? '16'
    : b === 0.5
      ? '8'
      : b === 0.75
        ? '8.'
        : b === 1
          ? '4'
          : b === 1.5
            ? '4.'
            : b === 2
              ? '2'
              : b === 3
                ? '2.'
                : b === 4
                  ? '1'
                  : '4';
}

const VF_DURATIONS: Record<number, { base: string; dots: number }> = {
  0.25: { base: '16', dots: 0 },
  0.375: { base: '16', dots: 1 },
  0.5: { base: '8', dots: 0 },
  0.75: { base: '8', dots: 1 },
  1: { base: 'q', dots: 0 },
  1.5: { base: 'q', dots: 1 },
  2: { base: 'h', dots: 0 },
  3: { base: 'h', dots: 1 },
  4: { base: 'w', dots: 0 },
  6: { base: 'w', dots: 1 }
};
export const vfDurationParts = (b: number) => VF_DURATIONS[b] || { base: 'q', dots: 0 };

/** Note-value glyph for the answer chips. */
export function rhythmSymbol(dur: number): string {
  return dur === 0.25
    ? '𝅘𝅥𝅯'
    : dur === 0.5
      ? '♪'
      : dur === 0.75
        ? '♪.'
        : dur === 1
          ? '♩'
          : dur === 1.5
            ? '♩.'
            : dur === 2
              ? '𝅗𝅥'
              : dur === 3
                ? '𝅗𝅥.'
                : dur === 4
                  ? '𝅝'
                  : String(dur);
}
