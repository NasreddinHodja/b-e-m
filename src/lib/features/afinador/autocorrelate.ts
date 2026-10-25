/** Below this RMS level the input counts as silence. */
const SILENCE_RMS = 0.018;
/** Amplitude under which the buffer edges are trimmed. */
const EDGE_THRESHOLD = 0.22;

/**
 * Fundamental frequency of `input` in Hz by autocorrelation with parabolic peak
 * interpolation, or -1 for silence or no clear period.
 */
export function autoCorrelate(input: Float32Array, sampleRate: number): number {
  let size = input.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += input[i] * input[i];
  rms = Math.sqrt(rms / size);
  if (rms < SILENCE_RMS) return -1;

  let r1 = 0;
  let r2 = size - 1;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(input[i]) < EDGE_THRESHOLD) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(input[size - i]) < EDGE_THRESHOLD) {
      r2 = size - i;
      break;
    }
  }
  const buf = input.slice(r1, r2);
  size = buf.length;

  const corr = new Float32Array(size);
  for (let lag = 0; lag < size; lag++) {
    let sum = 0;
    for (let i = 0; i < size - lag; i++) sum += buf[i] * buf[i + lag];
    corr[lag] = sum;
  }

  // Skip the initial downslope, then take the highest peak.
  let d = 0;
  while (d < size - 1 && corr[d] > corr[d + 1]) d++;
  let maxVal = -1;
  let maxIdx = -1;
  for (let i = d; i < size; i++) {
    if (corr[i] > maxVal) {
      maxVal = corr[i];
      maxIdx = i;
    }
  }
  if (maxIdx === -1 || maxIdx === 0 || maxIdx >= size - 1) return -1;

  const x1 = corr[maxIdx - 1];
  const x2 = corr[maxIdx];
  const x3 = corr[maxIdx + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const period = a ? maxIdx - b / (2 * a) : maxIdx;
  return sampleRate / period;
}
