import {
  Accidental,
  BarlineType,
  Beam,
  Dot,
  Formatter,
  Fraction,
  Renderer,
  Stave,
  StaveNote,
  StaveTie,
  Voice
} from 'vexflow';
import type { Model } from './model.js';
import { vfDurationParts } from './rhythm.js';
import { accToNum, accToVex, spellNote, splitSpelling } from './theory.js';

const BAR_WIDTH = 240;
const HEIGHT = 180;
/** Paper margin around the engraving once cropped (px). */
const CROP_PAD = 12;

/** Accidental to draw given the key signature: '' when the signature covers it, 'n' to cancel. */
function visibleAccidental(noteName: string, altered: Record<string, number>): string {
  const { base, acc } = splitSpelling(noteName);
  const sigAcc = altered[base.toUpperCase()] || 0;
  const noteAcc = accToNum(acc);
  if (noteAcc === sigAcc) return '';
  if (noteAcc === 0 && sigAcc !== 0) return 'n';
  return accToVex(acc);
}

/** Optional engraving steps: a failure skips that element instead of the whole staff. */
function ignoreErrors(fn: () => unknown) {
  try {
    fn();
  } catch {
    // Legacy behaviour: draw what can be drawn.
  }
}

/**
 * Shrink the SVG to what was drawn plus a margin. VexFlow draws into a fixed canvas with empty
 * space above the stave, so without this the staff can't be centred in its box.
 */
function cropToDrawing(host: HTMLElement) {
  const svg = host.querySelector('svg');
  if (!svg) return;
  const b = svg.getBBox();
  if (!b.width || !b.height) return;
  const w = Math.ceil(b.width + 2 * CROP_PAD);
  const h = Math.ceil(b.height + 2 * CROP_PAD);
  svg.setAttribute('viewBox', `${b.x - CROP_PAD} ${b.y - CROP_PAD} ${w} ${h}`);
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.style.width = `${w}px`;
  svg.style.height = `${h}px`;
}

/**
 * Engrave the exercise into `host` (replacing its content). `baseMidi` is the tonic used for
 * octaves. On failure, shows the error in place of the staff.
 */
export function renderStaff(host: HTMLElement, model: Model, baseMidi: number) {
  host.innerHTML = '';
  try {
    const [numBeats, beatValue] = model.meter.split('/').map(Number);
    const renderer = new Renderer(host as HTMLDivElement, Renderer.Backends.SVG);
    renderer.resize(model.bars * BAR_WIDTH + 20, HEIGHT);
    const ctx = renderer.getContext();

    model.eventsPerBar.forEach((cells, bi) => {
      const stave = new Stave(10 + bi * BAR_WIDTH, 50, BAR_WIDTH);
      if (bi === 0)
        stave.addClef('treble').addKeySignature(model.keySig.vexKey).addTimeSignature(model.meter);
      else ignoreErrors(() => stave.setBegBarType(BarlineType.NONE));
      if (bi === model.bars - 1) ignoreErrors(() => stave.setEndBarType(BarlineType.END));
      stave.setContext(ctx).draw();

      const tickables: StaveNote[] = [];
      const ties: { first: StaveNote; last: StaveNote }[] = [];
      let pendingTie: StaveNote | null = null;
      for (const c of cells) {
        const { base: durBase, dots } = vfDurationParts(c.dur);
        if (c.isRest) {
          const n = new StaveNote({ keys: ['b/4'], duration: durBase + 'r', clef: 'treble' });
          for (let d = 0; d < dots; d++) ignoreErrors(() => n.addModifier(new Dot(), 0));
          tickables.push(n);
          pendingTie = null;
          continue;
        }
        const name = spellNote(c.offset, model.tonicName, model.scaleType);
        const { base, acc } = splitSpelling(name);
        const oct = Math.floor((baseMidi + c.offset) / 12) - 1;
        // Dots are drawn as modifiers only; the note keeps its undotted ticks, as in the legacy app.
        const n = new StaveNote({
          keys: [base.toLowerCase() + accToVex(acc) + '/' + oct],
          duration: durBase,
          clef: 'treble'
        });
        const drawAcc = visibleAccidental(name, model.keySig.altered);
        if (drawAcc) n.addModifier(new Accidental(drawAcc), 0);
        for (let d = 0; d < dots; d++) ignoreErrors(() => n.addModifier(new Dot(), 0));
        tickables.push(n);
        if (c.tieIn && pendingTie) ties.push({ first: pendingTie, last: n });
        pendingTie = c.tieOut ? n : null;
      }

      const voice = new Voice({ num_beats: numBeats, beat_value: beatValue }).setStrict(false);
      voice.addTickables(tickables);
      new Formatter()
        .joinVoices([voice])
        .format([voice], bi === 0 ? BAR_WIDTH - 100 : BAR_WIDTH - 30);
      const groups = Array.from({ length: model.S.groups }, () =>
        model.S.kind === 'compound' ? new Fraction(3, 8) : new Fraction(1, 4)
      );
      let beams: Beam[] = [];
      try {
        // The legacy call also passed beamRests and maintainStemDirections, which VexFlow 4
        // ignores (it reads snake_case): only `groups` ever took effect.
        beams = Beam.generateBeams(tickables, { groups });
      } catch (e) {
        console.warn('B.E.M. — beaming:', e);
      }
      voice.draw(ctx, stave);
      for (const b of beams) ignoreErrors(() => b.setContext(ctx).draw());
      for (const t of ties) {
        ignoreErrors(() =>
          new StaveTie({
            first_note: t.first,
            last_note: t.last,
            first_indices: [0],
            last_indices: [0]
          })
            .setContext(ctx)
            .draw()
        );
      }
    });
    cropToDrawing(host);
  } catch (err) {
    console.error('Ditado — erro de notação:', err);
    const box = document.createElement('div');
    box.style.cssText = 'padding:20px;color:#444;font-family:var(--font-mono);font-size:11px';
    box.append('Não foi possível desenhar a pauta.', document.createElement('br'));
    box.append(String((err as Error)?.message ?? err));
    host.replaceChildren(box);
  }
}
