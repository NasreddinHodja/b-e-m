import {
  METER_STRUCT,
  lilyDuration,
  metricGroupsForBar,
  splitDurationsAtGroupBoundaries,
  type Cell,
  type Meter,
  type MeterStruct,
  type Motor
} from './rhythm.js';
import {
  MINOR_SCALES,
  MODES,
  accToLily,
  keySigInfo,
  spellNote,
  splitSpelling,
  type KeySig,
  type ScaleType
} from './theory.js';

/** A notated cell with its pitch: `offset` is now semitones from the tonic. */
export interface Event extends Omit<Cell, 'offset'> {
  offset: number;
  bar: number;
  accent: number;
}

export interface Model {
  tonicName: string;
  scaleType: ScaleType;
  meter: Meter;
  motor: Motor;
  bars: number;
  S: MeterStruct;
  keySig: KeySig;
  metricGroups: ReturnType<typeof metricGroupsForBar>;
  eventsPerBar: Event[][];
}

export interface ModelInput {
  tonicName: string;
  scaleType: ScaleType;
  meter: Meter;
  motor: Motor;
  bars: number;
}

/** Combine pitches and per-bar rhythms into notatable bars. */
export function buildModel(notes: number[], patterns: number[][], o: ModelInput): Model {
  const S = METER_STRUCT[o.meter];
  if (!Array.isArray(patterns) || patterns.length !== o.bars)
    throw new Error('Padrões rítmicos ausentes ou incompatíveis.');
  const eventsPerBar: Event[][] = [];
  let noteIndex = 0;
  for (let b = 0; b < o.bars; b++) {
    const durs = patterns[b];
    const cells: Event[] = [];
    for (const groupCells of splitDurationsAtGroupBoundaries(durs, o.meter)) {
      for (const c of groupCells) {
        const pitch = notes[noteIndex + c.attackIndex];
        cells.push({
          ...c,
          offset: pitch !== undefined ? pitch : 0,
          bar: b + 1,
          accent: S.accents[c.group] || 0
        });
      }
    }
    noteIndex += durs.length;
    cells.sort((a, b) => a.group - b.group || a.offset - b.offset);
    eventsPerBar.push(cells);
  }
  if (noteIndex !== notes.length)
    throw new Error(`Modelo desalinhado: ${noteIndex} vs ${notes.length}.`);
  return {
    ...o,
    S,
    keySig: keySigInfo(o.tonicName, o.scaleType),
    metricGroups: metricGroupsForBar(o.meter),
    eventsPerBar
  };
}

/** Sounding notes: tied cells merged into one longer note. */
export function flattenEvents(model: Model) {
  const out: { offset: number; dur: number; bar: number }[] = [];
  for (const cells of model.eventsPerBar) {
    for (const c of cells) {
      if (c.isRest) continue;
      if (c.tieIn && out.length) {
        out[out.length - 1].dur += c.dur;
        continue;
      }
      out.push({ offset: c.offset, dur: c.dur, bar: c.bar });
    }
  }
  return out;
}

function lilyNoteName(offset: number, tonic: string, scale: ScaleType, midi: number) {
  const name = spellNote(offset, tonic, scale);
  const letter = name[0].toLowerCase();
  const acc = accToLily(name.slice(1));
  const marks = Math.floor(midi / 12) - 1 - 3;
  return letter + acc + (marks > 0 ? "'".repeat(marks) : marks < 0 ? ','.repeat(-marks) : '');
}

function lilyKeySpec(tonic: string, scaleType: ScaleType) {
  const { base, acc } = splitSpelling(tonic);
  const lilyAcc =
    acc === '#' ? 'is' : acc === 'b' ? 'es' : acc === '##' ? 'isis' : acc === 'bb' ? 'eses' : '';
  const mode = MODES.includes(scaleType)
    ? scaleType
    : MINOR_SCALES.includes(scaleType)
      ? 'minor'
      : 'major';
  return `\\key ${base.toLowerCase()}${lilyAcc} \\${mode}`;
}

/**
 * LilyPond source for the exercise. `baseMidi` and `bpm` are read at export time,
 * like the legacy app read the form then.
 */
export function toLily(model: Model, baseMidi: number, bpm: number): string {
  let body = '';
  for (const cells of model.eventsPerBar) {
    for (const c of cells) {
      if (c.isRest) {
        body += lilyDuration(c.dur) + 'r ';
        continue;
      }
      const n = lilyNoteName(c.offset, model.tonicName, model.scaleType, baseMidi + c.offset);
      body += n + lilyDuration(c.dur) + (c.tieOut ? '~ ' : ' ');
    }
    body += '| ';
  }
  return `\\version "2.24.0"\n\\header { title = "B.E.M. Ditado Melódico" }\n\\score {\n  { ${lilyKeySpec(model.tonicName, model.scaleType)} \\time ${model.meter} ${body.trim()} }\n  \\layout { }\n  \\midi { \\tempo 4 = ${bpm} }\n}`;
}
