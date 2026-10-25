import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { loadLegacy, type Legacy } from '#lib/testing/legacy.js';
import { seededRandom } from '#lib/testing/random.js';
import { candidateSequence, distractors, slonimskySequence, type Transform } from './melody';
import { buildModel, flattenEvents, toLily } from './model';
import { METER_STRUCT, rhythmDurations, type Meter, type Motor } from './rhythm';
import { SCALES, TONICS, keySigInfo, pcOf, spellNote, type ScaleType } from './theory';

// The port against the legacy page's own Ditado code (index.html), on the same inputs and the
// same random draws: any difference is a parity bug.

let L: Legacy;
beforeAll(() => {
  L = loadLegacy(
    'function candidateSequence(',
    [
      'keySigInfo',
      'rhythmDurations',
      'spellNote',
      'candidateSequence',
      'slonimskySequence',
      'buildModel',
      'dToLily',
      'flattenEvents',
      'distractors'
    ],
    ['dCurrent']
  );
});
afterEach(() => vi.restoreAllMocks());

/** Run `port` and `legacy` on the same seeded random stream. */
function same(seed: number, port: () => unknown, legacy: () => unknown) {
  vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));
  const a = port();
  L.setRandom(seededRandom(seed));
  const b = legacy();
  vi.restoreAllMocks();
  return [JSON.parse(JSON.stringify(a ?? null)), JSON.parse(JSON.stringify(b ?? null))];
}

const SCALE_TYPES = Object.keys(SCALES) as ScaleType[];
const METERS = Object.keys(METER_STRUCT) as Meter[];
const MOTORS: Motor[] = ['basic', 'eighth', 'varied', 'syncopated'];

function form(o: Partial<Record<string, string>>) {
  const d = {
    dKey: '0',
    dScale: 'major',
    dMeter: '4/4',
    dRhythm: 'basic',
    dBars: '2',
    dPattern: '2 1 2 3',
    dReps: '2',
    dTransform: 'original',
    dBpm: '70',
    ...o
  };
  for (const [id, v] of Object.entries(d)) L.el(id).value = v!;
}

describe('Ditado parity with the legacy page', () => {
  it('spells every note the same, in every key and scale', () => {
    for (const tonic of TONICS)
      for (const scale of SCALE_TYPES)
        for (let off = -24; off <= 24; off++)
          expect(spellNote(off, tonic, scale), `${tonic} ${scale} ${off}`).toBe(
            L.fn.spellNote(...([off, tonic, scale] as never[]))
          );
  });

  it('finds the same key signatures', () => {
    for (const tonic of TONICS)
      for (const scale of SCALE_TYPES)
        expect(keySigInfo(tonic, scale)).toEqual(
          JSON.parse(JSON.stringify(L.fn.keySigInfo(...([tonic, scale] as never[]))))
        );
  });

  it('draws the same rhythms', () => {
    for (let seed = 1; seed <= 40; seed++)
      for (const meter of METERS)
        for (const motor of MOTORS) {
          const [a, b] = same(
            seed,
            () => rhythmDurations(meter, motor, 4),
            () => L.fn.rhythmDurations(...([meter, motor, 4] as never[]))
          );
          expect(a, `${seed} ${meter} ${motor}`).toEqual(b);
        }
  });

  it('generates the same melodies', () => {
    const combos = [
      { motion: 'mixed', contour: 'mixed', focus: 'scale', range: 12, maxLeap: 7 },
      { motion: 'step', contour: 'asc', focus: 'scale', range: 12, maxLeap: 5 },
      { motion: 'leap', contour: 'arch', focus: 'thirds', range: 16, maxLeap: 12 },
      { motion: 'mixed', contour: 'wave', focus: 'tonic', range: 7, maxLeap: 7 },
      { motion: 'mixed', contour: 'desc', focus: 'chromatic', range: 16, maxLeap: 12 },
      { motion: 'leap', contour: 'mixed', focus: 'fourths', range: 16, maxLeap: 12 }
    ] as const;
    for (const c of combos)
      for (const scale of ['major', 'harmonic', 'pentMinor', 'locrian'] as ScaleType[])
        for (let key = 0; key < 12; key += 5) {
          form({ dKey: String(key) });
          for (let seed = 1; seed <= 15; seed++) {
            const [a, b] = same(
              seed,
              () =>
                candidateSequence({
                  slotCount: 8,
                  scale: SCALES[scale],
                  startDeg: 0,
                  endDeg: 0,
                  ...c,
                  baseMidi: 60 + pcOf(TONICS[key])
                }),
              () =>
                L.fn.candidateSequence(
                  ...([
                    8,
                    SCALES[scale],
                    0,
                    0,
                    c.range,
                    c.maxLeap,
                    c.motion,
                    c.contour,
                    c.focus
                  ] as never[])
                )
            );
            expect(a, JSON.stringify({ c, scale, key, seed })).toEqual(b);
          }
        }
  });

  it('builds the same Slonimsky lines', () => {
    const transforms: Transform[] = ['original', 'retrograde', 'inversion', 'retro-inv'];
    for (const pattern of ['2 1 2 3', '5', '1, -2 4', '7 7 7 7 7'])
      for (const reps of ['1', '3', 'x'])
        for (const transform of transforms)
          for (const target of [4, 9, 16]) {
            form({ dKey: '7', dPattern: pattern, dReps: reps, dTransform: transform });
            const [a, b] = same(
              target,
              () =>
                slonimskySequence({ pattern, reps, transform, targetCount: target, baseMidi: 67 }),
              () => L.fn.slonimskySequence(...([target] as never[]))
            );
            expect(a, `${pattern} ${reps} ${transform} ${target}`).toEqual(b);
          }
  });

  it('builds the same model, playback and LilyPond from the same exercise', () => {
    for (let seed = 1; seed <= 30; seed++)
      for (const meter of METERS) {
        const key = seed % 12;
        const scale = SCALE_TYPES[seed % SCALE_TYPES.length];
        const motor = MOTORS[seed % MOTORS.length];
        form({
          dKey: String(key),
          dScale: scale,
          dMeter: meter,
          dRhythm: motor,
          dBars: '2',
          dBpm: String(60 + seed)
        });
        vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));
        const patterns = rhythmDurations(meter, motor, 2);
        vi.restoreAllMocks();
        const n = patterns.flat().length;
        const notes = Array.from({ length: n }, (_, i) => ((i * 5 + seed) % 15) - 4);

        const port = buildModel(notes, patterns, {
          tonicName: TONICS[key],
          scaleType: scale,
          meter,
          motor,
          bars: 2
        });
        const legacy = L.fn.buildModel(...([notes, patterns] as never[])) as typeof port;
        const where = `${seed} ${meter} ${scale}`;
        expect(JSON.parse(JSON.stringify(port.eventsPerBar)), where).toEqual(
          JSON.parse(JSON.stringify(legacy.eventsPerBar))
        );
        expect(port.keySig, where).toEqual(JSON.parse(JSON.stringify(legacy.keySig)));
        expect(port.metricGroups, where).toEqual(JSON.parse(JSON.stringify(legacy.metricGroups)));

        L.set('dCurrent', { notes, model: legacy });
        expect(flattenEvents(port), where).toEqual(
          JSON.parse(JSON.stringify(L.fn.flattenEvents()))
        );
        expect(toLily(port, 60 + pcOf(TONICS[key]), 60 + seed), where).toBe(L.fn.dToLily());
      }
  });

  it('offers the same distractors', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const notes = [0, 2, 4, 5, 7, 9, 11, 12].slice(0, 3 + (seed % 6));
      const [a, b] = same(
        seed,
        () => distractors(notes),
        () => L.fn.distractors(...([notes] as never[]))
      );
      expect(a, String(seed)).toEqual(b);
    }
  });
});
