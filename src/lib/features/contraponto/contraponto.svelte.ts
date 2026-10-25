import { audio } from '#lib/audio/engine.svelte.js';
import { midiToFreq } from '#lib/music/pitch.js';
import { generateLilyPond } from './lilypond.js';
import {
  analyze,
  pairsCheck,
  parse,
  readVoice,
  spellNear,
  tokens,
  type Issue,
  type Line,
  type Species
} from './rules.js';

export interface Voice {
  /** The cantus firmus (always voice 0). */
  cf: boolean;
  sp: Species;
  /** Audible in playback. */
  on: boolean;
  txt: string;
}

export type VoiceIssue = Issue & { v: number };

const CF = 'D4 F4 E4 D4 G4 F4 A4 G4 F4 E4 D4';
const EXAMPLES: Record<Species, string> = {
  1: 'A4 D5 C5 B4 E5 D5 C5 D5 D5 C#5 D5',
  2: 'A4 D5 C5 D5 E5 G5 F5 D5 E5 G5 A5 D5 F5 C5 D5 G4 A4 C5 B4 C#5 D5'
};

/** Piano-roll geometry: left margin, half-measure column width, row height (px). */
export const X0 = 44;
export const CW = 34;
export const RH = 10;

export const voiceLabel = (i: number) => (i ? 'Voz ' + (i + 1) : 'Cantus firmus');
/** Whether the voice has one note per cantus note. */
export const oneNotePerBar = (v: Voice) => v.cf || v.sp === 1;
const avg = (r: Line) => {
  const a = r.filter((x) => x !== null);
  return a.length ? a.reduce((s, x) => s + x.midi, 0) / a.length : 0;
};

/** Fux counterpoint checker: voices, analysis, playback. State survives navigation. */
class Contraponto {
  voices = $state<Voice[]>([]);
  /** Index of the voice being edited. */
  active = $state(1);
  bpm = $state(80);
  loop = $state(false);
  /** Accidental for notes placed on the roll: '', '#' or 'b'. */
  acc = $state('');
  /** LilyPond textarea. Regenerated on every note change, editable in between. */
  lily = $state('');
  copyLabel = $state('Copiar .ly');
  /** Playhead x in the roll, or null when stopped. */
  head = $state<number | null>(null);

  parsed = $derived(this.voices.map((v) => readVoice(v.txt, !v.cf && v.sp === 2)));
  /** Each voice's notes. */
  lines = $derived(this.parsed.map((r) => r.out));
  issues = $derived.by(() => this.#analyze());
  errors = $derived(this.issues.filter((i) => i.s === 'erro').length);

  #playback: { t0: number; unit: number; total: number } | null = null;

  constructor() {
    this.setExample(1);
  }

  get summary(): { text: string; tone: 'ok' | 'bad' | null } {
    const e = this.errors;
    const w = this.issues.length - e;
    const tone = e ? 'bad' : this.issues.length ? null : 'ok';
    const cp = this.lines[1];
    if (!cp || !cp.length) return { text: 'Digite ou desenhe o contraponto.', tone };
    if (e || w)
      return { text: `${e} erro${e === 1 ? '' : 's'} e ${w} aviso${w === 1 ? '' : 's'}`, tone };
    return { text: 'Nenhum problema encontrado. Bom trabalho!', tone };
  }

  #analyze(): VoiceIssue[] {
    const bad: string[] = [];
    this.parsed.forEach((r, i) => {
      if (r.bad.length) bad.push(`${voiceLabel(i)} (${r.bad.join(', ')})`);
    });
    if (bad.length)
      return [
        {
          v: 0,
          k: -1,
          s: 'erro',
          m: 'Notas não reconhecidas: ' + bad.join('; ') + '. Use D4, F#4, Bb3.'
        }
      ];
    const P = this.lines;
    const V = this.voices;
    const out: VoiceIssue[] = [];
    const cf = P[0];
    const mc = avg(cf);
    const multi = V.length > 2;
    V.forEach((v, i) => {
      if (!i) return;
      for (const x of analyze(cf, P[i], v.sp, avg(P[i]) >= mc))
        out.push({ ...x, v: i, m: (multi ? voiceLabel(i) + ': ' : '') + x.m });
    });
    for (let a = 1; a < V.length; a++)
      for (let b = a + 1; b < V.length; b++)
        if (P[a].length && P[b].length)
          out.push(
            ...pairsCheck(P[a], P[b], V[a].sp, V[b].sp, voiceLabel(a), voiceLabel(b), cf.length, b)
          );
    return out;
  }

  /** Call after any change to the notes: refreshes the LilyPond text, as the legacy `run()` did. */
  #changed() {
    this.generateLily();
  }

  generateLily() {
    const P = this.lines;
    this.lily = generateLilyPond(
      this.voices.map((v, i) => ({
        line: P[i] || [],
        oneNotePerBar: oneNotePerBar(v),
        bass: i !== 0 && avg(P[i] || []) < avg(P[0] || []) - 6
      })),
      +this.bpm
    );
    return this.lily;
  }

  setExample(sp: Species) {
    this.voices = [
      { cf: true, sp: 1, on: true, txt: CF },
      { cf: false, sp, on: true, txt: EXAMPLES[sp] }
    ];
    this.active = 1;
    this.#changed();
  }

  setText(i: number, txt: string) {
    this.voices[i].txt = txt;
    this.#changed();
  }

  /** Switch species, doubling or halving the notes. */
  setSpecies(i: number, sp: Species) {
    const v = this.voices[i];
    const a = tokens(v.txt);
    v.txt = (
      sp === 2
        ? a.flatMap((t, j) => (j < a.length - 1 ? [t, t] : [t]))
        : a.filter((_, j) => j % 2 === 0)
    ).join(' ');
    v.sp = sp;
    this.#changed();
  }

  addVoice() {
    if (this.voices.length >= 4) return;
    this.voices.push({
      cf: false,
      sp: 1,
      on: true,
      // The cantus an octave up.
      txt: tokens(this.voices[0].txt)
        .map((t) => t.replace(/(-?\d+)$/, (_, o) => String(+o + 1)))
        .join(' ')
    });
    this.active = this.voices.length - 1;
    this.#changed();
  }

  removeVoice(i: number) {
    this.voices.splice(i, 1);
    this.active = Math.min(this.active, this.voices.length - 1);
    this.#changed();
  }

  addMeasure() {
    for (const v of this.voices) {
      const a = tokens(v.txt);
      if (!a.length) continue;
      const l = a[a.length - 1];
      a.push(l);
      if (!oneNotePerBar(v)) a.push(l);
      v.txt = a.join(' ');
    }
    this.#changed();
  }

  removeMeasure() {
    if (this.lines[0].length < 3) return;
    for (const v of this.voices) {
      const cut = oneNotePerBar(v) ? 1 : 2;
      const a = tokens(v.txt);
      v.txt = a.slice(0, Math.max(0, a.length - cut)).join(' ');
    }
    this.#changed();
  }

  /** Note index of voice `vi` under half-measure column `h`, or -1. */
  slotAt(vi: number, h: number): number {
    const n = this.lines[0].length;
    if (h < 0 || h >= 2 * n) return -1;
    return oneNotePerBar(this.voices[vi]) ? Math.floor(h / 2) : Math.min(h, 2 * n - 2);
  }

  /** Set note `k` of voice `vi` to MIDI `m` (spelled with the chosen accidental) and preview it. */
  place(vi: number, k: number, m: number) {
    const nm = spellNear(m, this.acc);
    const v = this.voices[vi];
    const a = tokens(v.txt);
    if (!nm || k >= a.length || a[k] === nm) return;
    a[k] = nm;
    v.txt = a.join(' ');
    this.#changed();
    this.#preview(vi, k, nm);
  }

  #preview(vi: number, k: number, nm: string) {
    try {
      const p = parse(nm);
      if (!p) return;
      const t = audio.now() + 0.01;
      audio.playNote(midiToFreq(p.midi), t, 0.6);
      const cn = this.lines[0][oneNotePerBar(this.voices[vi]) ? k : Math.floor(k / 2)];
      if (vi && cn) audio.playNote(midiToFreq(cn.midi), t, 0.6);
    } catch {
      // No audio: placing the note still works.
    }
  }

  play() {
    if (!this.lines[0]?.length) return;
    this.#start();
  }

  #start() {
    this.stop();
    let t0: number;
    try {
      t0 = audio.now() + 0.1;
    } catch {
      return;
    }
    const unit = 60 / +this.bpm;
    const n = this.lines[0].length;
    this.voices.forEach((v, i) => {
      if (!v.on) return;
      const line = this.lines[i];
      line.forEach((p, k) => {
        if (!p) return;
        const o = oneNotePerBar(v);
        const u = o ? 2 * k : k;
        const w = o || k === line.length - 1 ? 2 : 1;
        audio.playNote(midiToFreq(p.midi), t0 + u * unit, w * unit * 0.98);
      });
    });
    this.#playback = { t0, unit, total: 2 * n * unit };
    this.#frame();
  }

  #frame = () => {
    const pb = this.#playback;
    if (!pb) return;
    const e = audio.now() - pb.t0;
    if (e >= pb.total) {
      if (this.loop) this.#start();
      else this.stop();
      return;
    }
    this.head = X0 + (Math.max(0, e) / pb.unit) * CW;
    requestAnimationFrame(this.#frame);
  };

  stop() {
    this.#playback = null;
    this.head = null;
  }

  async copyLily() {
    const s = this.lily || this.generateLily();
    if (!s || !navigator.clipboard) return;
    await navigator.clipboard.writeText(s);
    this.copyLabel = 'Copiado ✓';
    setTimeout(() => (this.copyLabel = 'Copiar .ly'), 1200);
  }

  saveLily() {
    const s = this.lily || this.generateLily();
    if (!s) return;
    const blob = new Blob([s], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bem-contraponto.ly';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
}

export const contraponto = new Contraponto();
