import {
  ENVELOPES,
  OUTPUT_PROFILES,
  PARTIALS,
  VIBRATO_CENTS,
  VIBRATO_RATE_HZ,
  type OutputMode
} from './profiles';

/**
 * The app's synth: one AudioContext, a master gain into EQ → compressor, plus a reverb send.
 * The context is created lazily on first use so it starts from a user gesture.
 */
class AudioEngine {
  mode = $state<OutputMode>('speaker');
  #volume = $state(70);

  #ctx: AudioContext | null = null;
  #master: GainNode | null = null;

  /** 0–100, shared by every volume slider. */
  get volume() {
    return this.#volume;
  }
  set volume(v: number) {
    this.#volume = v;
    if (this.#master) this.#master.gain.value = v / 100;
  }

  /** The running context, created on first call. */
  get ctx(): AudioContext {
    if (!this.#ctx) {
      this.#ctx = new AudioContext();
      this.#buildGraph();
    }
    if (this.#ctx.state === 'suspended') void this.#ctx.resume();
    return this.#ctx;
  }

  /** Context time in seconds, creating the context if needed. */
  now(): number {
    return this.ctx.currentTime;
  }

  /** Whether a context exists yet, without creating one. */
  get started(): boolean {
    return this.#ctx !== null;
  }

  setMode(mode: OutputMode) {
    this.mode = mode;
    const ctx = this.#ctx;
    const master = this.#master;
    if (!ctx || !master) return;
    // Fade out, then rebuild the graph for the new profile at full volume.
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
    setTimeout(() => {
      this.#buildGraph();
      this.#master!.gain.linearRampToValueAtTime(this.volume / 100, ctx.currentTime + 0.08);
    }, 100);
  }

  /** Play one synthesized note of `freq` Hz starting at context time `t`. */
  playNote(freq: number, t: number, duration?: number) {
    const ctx = this.ctx;
    const env = ENVELOPES[this.mode];
    const minDur = env.attack + env.decay + env.release + 0.06;
    const dur = Math.max(duration ?? env.dur, minDur);

    const g = ctx.createGain();
    g.connect(this.#master!);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(env.peak, t + env.attack);
    g.gain.linearRampToValueAtTime(env.sustain, t + env.attack + env.decay);
    g.gain.setValueAtTime(env.sustain, t + dur - env.release);
    g.gain.linearRampToValueAtTime(0, t + dur);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = VIBRATO_RATE_HZ;
    lfoGain.gain.value = freq * (Math.pow(2, VIBRATO_CENTS[this.mode] / 1200) - 1);
    lfo.connect(lfoGain);
    lfo.start(t);
    lfo.stop(t + dur + 0.15);

    for (const { gain, factor, detune } of PARTIALS[this.mode]) {
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * factor;
      osc.detune.value = detune;
      lfoGain.connect(osc.frequency);
      osc.connect(og);
      og.connect(g);
      og.gain.value = gain;
      osc.start(t);
      osc.stop(t + dur + 0.15);
    }
  }

  /**
   * A bare sine blip straight to the output, bypassing EQ and volume (metronome clicks, timer
   * chimes). Gain starts at `peak` (or ramps to it over `attack`), decays to 0.001 by `decayEnd`,
   * and the oscillator stops at `stopAt`; both times are relative to `t`.
   */
  blip(
    freq: number,
    t: number,
    o: { peak: number; attack?: number; decayEnd: number; stopAt: number }
  ) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    if (o.attack) {
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(o.peak, t + o.attack);
    } else {
      g.gain.setValueAtTime(o.peak, t);
    }
    g.gain.exponentialRampToValueAtTime(0.001, t + o.decayEnd);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + o.stopAt);
  }

  #buildGraph() {
    const ctx = this.#ctx!;
    this.#master?.disconnect();
    const p = OUTPUT_PROFILES[this.mode];

    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = p.lowShelfFreq;
    low.gain.value = p.lowShelfGain;

    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = p.peakFreq;
    mid.Q.value = p.peakQ;
    mid.gain.value = p.peakGain;

    const high = ctx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = p.highShelfFreq;
    high.gain.value = p.highShelfGain;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 6;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.15;

    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, p.reverbDur, p.reverbDecay);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = p.reverbMix;

    const master = ctx.createGain();
    master.gain.value = this.volume / 100;
    master.connect(low);
    low.connect(mid);
    mid.connect(high);
    high.connect(comp);
    comp.connect(ctx.destination);
    high.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(ctx.destination);
    this.#master = master;
  }
}

/** Exponentially decaying stereo noise, used as the reverb's impulse response. */
function impulse(ctx: AudioContext, dur: number, decay: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

export const audio = new AudioEngine();
