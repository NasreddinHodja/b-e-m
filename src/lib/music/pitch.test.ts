import { describe, expect, it } from 'vitest';
import { midiToFreq, mod12, pcName } from './pitch';

describe('pitch', () => {
  it('maps MIDI to equal-tempered Hz around A4 = 440', () => {
    expect(midiToFreq(69)).toBe(440);
    expect(midiToFreq(81)).toBe(880);
    expect(midiToFreq(60)).toBeCloseTo(261.626, 3);
  });

  it('wraps negative numbers into 0–11', () => {
    expect(mod12(-1)).toBe(11);
    expect(mod12(-13)).toBe(11);
    expect(mod12(25)).toBe(1);
  });

  it('names pitch classes with the app’s mixed spelling', () => {
    expect([60, 61, 63, 66, 68, 70].map(pcName)).toEqual(['C', 'C#', 'Eb', 'F#', 'Ab', 'Bb']);
    expect(pcName(-1)).toBe('B');
  });
});
