export type OutputMode = 'speaker' | 'headphone';

/** EQ and reverb per output device: speakers get less bass and more presence. */
export const OUTPUT_PROFILES = {
  speaker: {
    lowShelfFreq: 300,
    lowShelfGain: -8,
    peakFreq: 900,
    peakGain: +5,
    peakQ: 1.2,
    highShelfFreq: 3500,
    highShelfGain: +2,
    reverbMix: 0.06,
    reverbDur: 0.6,
    reverbDecay: 2.0
  },
  headphone: {
    lowShelfFreq: 200,
    lowShelfGain: +3,
    peakFreq: 700,
    peakGain: +1,
    peakQ: 0.8,
    highShelfFreq: 4000,
    highShelfGain: +1,
    reverbMix: 0.2,
    reverbDur: 1.8,
    reverbDecay: 2.8
  }
} as const;

/** Additive partials of the synthesized tone: gain, frequency factor and detune in cents. */
export const PARTIALS: Record<OutputMode, { gain: number; factor: number; detune: number }[]> = {
  speaker: [
    { gain: 0.55, factor: 1.0, detune: 0 },
    { gain: 0.42, factor: 2.0, detune: 0 },
    { gain: 0.28, factor: 3.0, detune: 0 },
    { gain: 0.18, factor: 4.0, detune: 0 },
    { gain: 0.38, factor: 1.0, detune: +6 },
    { gain: 0.38, factor: 1.0, detune: -6 },
    { gain: 0.22, factor: 2.0, detune: +8 },
    { gain: 0.22, factor: 2.0, detune: -8 }
  ],
  headphone: [
    { gain: 0.5, factor: 1.0, detune: 0 },
    { gain: 0.14, factor: 0.5, detune: 0 },
    { gain: 0.22, factor: 2.0, detune: 0 },
    { gain: 0.12, factor: 3.0, detune: 0 },
    { gain: 0.06, factor: 4.0, detune: 0 },
    { gain: 0.28, factor: 1.0, detune: +4 },
    { gain: 0.28, factor: 1.0, detune: -4 }
  ]
};

export const ENVELOPES = {
  speaker: { attack: 0.008, peak: 0.42, decay: 0.12, sustain: 0.26, release: 0.35, dur: 1.6 },
  headphone: { attack: 0.022, peak: 0.36, decay: 0.18, sustain: 0.24, release: 0.5, dur: 2.0 }
} as const;

/** Vibrato depth in cents. */
export const VIBRATO_CENTS: Record<OutputMode, number> = { speaker: 1.5, headphone: 3.0 };
export const VIBRATO_RATE_HZ = 5.2;
