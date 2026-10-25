import { PC_NAMES, mod12 } from '#lib/music/pitch.js';
import { autoCorrelate } from './autocorrelate.js';

export type TunerMode = 'chromatic' | 'guitar' | 'voice';

/** Accepted pitch range per mode, in Hz. */
const MODE_RANGES: Record<TunerMode, { min: number; max: number }> = {
  chromatic: { min: 27.5, max: 4200 },
  guitar: { min: 80, max: 1400 },
  voice: { min: 85, max: 1100 }
};
/** Within this many cents counts as in tune. */
const IN_TUNE_CENTS = 5;
const HISTORY_LEN = 120;
const STABILITY_LEN = 20;

/**
 * Microphone tuner. Like the legacy app, it keeps listening when you leave the page,
 * until "Desligar microfone" is pressed.
 */
class Tuner {
  on = $state(false);
  refFreq = $state(440);
  mode = $state<TunerMode>('chromatic');

  noteName = $state<string | null>(null);
  octave = $state(0);
  centsText = $state('— CENTS');
  stabilityText = $state('AGUARDANDO SOM...');
  status = $state('MICROFONE ATIVO');
  info = $state('—');
  infoColor = $state<'green' | 'gold' | 'red' | null>(null);
  /** Last measured offset, or null before any reading. */
  cents = $state<number | null>(null);
  /** Needle position, 0–100 % of the meter. */
  needle = $state(50);
  /** Recent cents readings for the sparkline; replaced (not mutated) on each reading. */
  history = $state.raw<number[]>([]);

  #stream: MediaStream | null = null;
  #ctx: AudioContext | null = null;
  #analyser: AnalyserNode | null = null;
  #raf: number | null = null;
  #smoothed: number | null = null;
  #stability: number[] = [];
  #needleTarget = 50;

  async start() {
    try {
      if (this.#ctx) this.#close();
      this.#stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          // Non-standard constraint the legacy app passed; browsers ignore what they don't know.
          ...({ latency: 0 } as MediaTrackConstraints)
        }
      });
      const ctx = new AudioContext();
      this.#ctx = ctx;
      const source = ctx.createMediaStreamSource(this.#stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.82;
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 60;
      hpf.Q.value = 0.7;
      source.connect(hpf);
      hpf.connect(analyser);
      this.#analyser = analyser;
      this.on = true;
      this.status = 'MICROFONE ATIVO';
      this.#smoothed = null;
      this.#stability = [];
      this.history = [];
      this.#loop();
    } catch {
      this.info = '❌ Microfone bloqueado';
    }
  }

  stop() {
    this.#close();
    this.on = false;
    this.status = 'MICROFONE DESLIGADO';
  }

  setMode(mode: TunerMode) {
    this.mode = mode;
    this.#smoothed = null;
    this.#stability = [];
  }

  #close() {
    if (this.#raf) cancelAnimationFrame(this.#raf);
    this.#stream?.getTracks().forEach((t) => t.stop());
    void this.#ctx?.close();
    this.#ctx = this.#stream = this.#analyser = this.#raf = null;
    this.#smoothed = null;
  }

  #loop() {
    const analyser = this.#analyser!;
    const sampleRate = this.#ctx!.sampleRate;
    const buf = new Float32Array(analyser.fftSize);
    const update = () => {
      analyser.getFloatTimeDomainData(buf);
      const pitch = autoCorrelate(buf, sampleRate);
      if (pitch !== -1) {
        const range = MODE_RANGES[this.mode];
        if (pitch >= range.min && pitch <= range.max) {
          if (this.#smoothed === null) this.#smoothed = pitch;
          else {
            // Follow big jumps quickly, smooth small wobble.
            const ratio = Math.abs(pitch - this.#smoothed) / this.#smoothed;
            const alpha = ratio > 0.15 ? 0.6 : 0.18;
            this.#smoothed = this.#smoothed * (1 - alpha) + pitch * alpha;
          }
          this.#show(this.#smoothed);
        }
      }
      this.needle += (this.#needleTarget - this.needle) * 0.12;
      this.#raf = requestAnimationFrame(update);
    };
    update();
  }

  #show(freq: number) {
    const noteNum = 12 * Math.log2(freq / this.refFreq) + 69;
    const rounded = Math.round(noteNum);
    const targetFreq = this.refFreq * Math.pow(2, (rounded - 69) / 12);
    const cents = Math.max(-50, Math.min(50, 1200 * Math.log2(freq / targetFreq)));
    this.#needleTarget = 50 + cents * 0.75;

    this.#stability.push(freq);
    if (this.#stability.length > STABILITY_LEN) this.#stability.shift();
    let stability = 0;
    if (this.#stability.length > 5) {
      const n = this.#stability.length;
      const mean = this.#stability.reduce((a, b) => a + b, 0) / n;
      const dev = Math.sqrt(this.#stability.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
      stability = Math.max(0, Math.min(100, Math.round(100 - dev * 2.5)));
    }

    const history = [...this.history, cents];
    if (history.length > HISTORY_LEN) history.shift();
    this.history = history;

    this.noteName = PC_NAMES[mod12(rounded)];
    this.octave = Math.floor(rounded / 12) - 1;
    this.cents = cents;
    this.centsText = `${cents >= 0 ? '+' : ''}${Math.round(cents)} CENTS`;
    this.stabilityText = `ESTABILIDADE ${stability}%`;
    const abs = Math.abs(cents);
    if (abs < IN_TUNE_CENTS) {
      this.info = '✓ Afinado';
      this.infoColor = 'green';
    } else if (cents > 0) {
      this.info = '↑ Muito agudo';
      this.infoColor = 'gold';
    } else {
      this.info = '↓ Muito grave';
      this.infoColor = 'red';
    }
  }
}

export const tuner = new Tuner();
