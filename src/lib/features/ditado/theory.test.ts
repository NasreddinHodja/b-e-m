import { describe, expect, it } from 'vitest';
import { degreeOf, keySigInfo, pcOf, spellNote } from './theory';

describe('spellNote', () => {
  it('spells scale notes on the scale’s letters', () => {
    expect([0, 2, 4, 5, 7, 9, 11].map((o) => spellNote(o, 'C', 'major'))).toEqual([
      'C',
      'D',
      'E',
      'F',
      'G',
      'A',
      'B'
    ]);
    expect([0, 2, 3, 5, 7, 8, 10].map((o) => spellNote(o, 'C', 'minor'))).toEqual([
      'C',
      'D',
      'E♭',
      'F',
      'G',
      'A♭',
      'B♭'
    ]);
    expect(spellNote(4, 'F#', 'major')).toBe('A♯');
    expect(spellNote(11, 'F#', 'major')).toBe('E♯');
  });

  it('spells chromatic notes on the fallback letter', () => {
    expect(spellNote(1, 'C', 'major')).toBe('C♯');
    expect(spellNote(6, 'C', 'major')).toBe('F♯');
  });

  it('skips letters in pentatonics', () => {
    expect([0, 2, 4, 7, 9].map((o) => spellNote(o, 'C', 'pentMajor'))).toEqual([
      'C',
      'D',
      'E',
      'G',
      'A'
    ]);
  });

  it('works an octave away', () => {
    expect(spellNote(-12, 'D', 'major')).toBe('D');
    expect(spellNote(16, 'D', 'major')).toBe('F♯');
  });
});

describe('keySigInfo', () => {
  it('finds the signature of majors, minors and modes', () => {
    expect(keySigInfo('D', 'major')).toEqual({ vexKey: 'D', altered: { F: 1, C: 1 } });
    expect(keySigInfo('A', 'minor')).toEqual({ vexKey: 'C', altered: {} });
    expect(keySigInfo('D', 'dorian')).toEqual({ vexKey: 'C', altered: {} });
    expect(keySigInfo('F', 'major')).toEqual({ vexKey: 'F', altered: { B: -1 } });
    expect(keySigInfo('E', 'phrygian').vexKey).toBe('C');
  });
});

describe('small helpers', () => {
  it('reads pitch classes, unknown as 0', () => {
    expect(pcOf('Bb')).toBe(10);
    expect(pcOf('H')).toBe(0);
  });

  it('names degrees in any octave', () => {
    expect(degreeOf(0)).toBe('1');
    expect(degreeOf(-1)).toBe('7');
    expect(degreeOf(15)).toBe('b3');
  });
});
