import { describe, expect, it } from 'vitest';
import { autoCorrelate } from './autocorrelate';

const RATE = 44100;
const SIZE = 4096;

function tone(freq: number, amp = 0.5, harmonics: number[] = [1]): Float32Array {
  const buf = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++)
    for (const [k, h] of harmonics.entries())
      buf[i] +=
        ((amp * h) / harmonics.length) * Math.sin((2 * Math.PI * freq * (k + 1) * i) / RATE);
  return buf;
}

describe('autoCorrelate', () => {
  it('finds the pitch of a sine within a cent or so', () => {
    for (const f of [82.41, 110, 196, 440, 659.25]) {
      const got = autoCorrelate(tone(f), RATE);
      expect(Math.abs(1200 * Math.log2(got / f)), `${f} Hz`).toBeLessThan(2);
    }
  });

  it('finds the fundamental under harmonics', () => {
    const got = autoCorrelate(tone(220, 0.6, [1, 0.5, 0.3]), RATE);
    expect(Math.abs(1200 * Math.log2(got / 220))).toBeLessThan(2);
  });

  it('calls quiet input silence', () => {
    expect(autoCorrelate(new Float32Array(SIZE), RATE)).toBe(-1);
    expect(autoCorrelate(tone(440, 0.01), RATE)).toBe(-1);
  });
});
