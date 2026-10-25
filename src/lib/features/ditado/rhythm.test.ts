import { afterEach, describe, expect, it, vi } from 'vitest';
import { seededRandom } from '#lib/testing/random.js';
import {
  METER_STRUCT,
  lilyDuration,
  rhythmDurations,
  splitDurationsAtGroupBoundaries,
  type Meter,
  type Motor
} from './rhythm';

const METERS = Object.keys(METER_STRUCT) as Meter[];
const MOTORS: Motor[] = ['basic', 'eighth', 'varied', 'syncopated'];
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

afterEach(() => vi.restoreAllMocks());

describe('rhythmDurations', () => {
  it('fills every bar exactly, in every meter and style', () => {
    for (let seed = 0; seed < 50; seed++) {
      vi.spyOn(Math, 'random').mockImplementation(seededRandom(seed));
      for (const meter of METERS) {
        const S = METER_STRUCT[meter];
        for (const motor of MOTORS) {
          const bars = rhythmDurations(meter, motor, 3);
          expect(bars).toHaveLength(3);
          for (const bar of bars) expect(sum(bar)).toBeCloseTo(S.groups * S.groupDur, 9);
        }
      }
      vi.restoreAllMocks();
    }
  });

  it('plays one note per beat in the basic style', () => {
    expect(rhythmDurations('4/4', 'basic', 1)).toEqual([[1, 1, 1, 1]]);
    expect(rhythmDurations('6/8', 'basic', 1)).toEqual([[1.5, 1.5]]);
  });
});

describe('splitDurationsAtGroupBoundaries', () => {
  it('ties a note across a beat boundary', () => {
    const groups = splitDurationsAtGroupBoundaries([0.5, 1, 0.5, 1, 1], '4/4');
    expect(groups[0].map((c) => [c.dur, c.tieIn, c.tieOut, c.attackIndex])).toEqual([
      [0.5, false, false, 0],
      [0.5, false, true, 1]
    ]);
    expect(groups[1].map((c) => [c.dur, c.tieIn, c.tieOut, c.attackIndex])).toEqual([
      [0.5, true, false, 1],
      [0.5, false, false, 2]
    ]);
  });

  it('rejects a bar that doesn’t add up', () => {
    expect(() => splitDurationsAtGroupBoundaries([1, 1], '4/4')).toThrow(/Ritmo inválido/);
  });
});

it('writes LilyPond durations', () => {
  expect([0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5].map(lilyDuration)).toEqual([
    '16',
    '8',
    '8.',
    '4',
    '4.',
    '2',
    '2.',
    '1',
    '4'
  ]);
});
