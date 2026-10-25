<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import {
    CW,
    RH,
    X0,
    contraponto as c,
    oneNotePerBar
  } from '#lib/features/contraponto/contraponto.svelte.js';
  import { LET } from '#lib/features/contraponto/rules.js';
  import { VOICE_COLORS } from './colors.js';

  let svg = $state<SVGSVGElement>();
  /** While dragging, the pitch range is frozen so the roll doesn't rescale under the pointer. */
  let drag = $state<{ vi: number; h: number } | null>(null);
  let frozen = $state<{ lo: number; hi: number } | null>(null);

  const geo = $derived.by(() => {
    const n = c.lines[0]?.length ?? 0;
    const all = c.lines.flat().flatMap((x) => (x ? [x.midi] : []));
    if (!n || !all.length) return null;
    const lo = frozen?.lo ?? Math.min(...all) - 4;
    const hi = frozen?.hi ?? Math.max(...all) + 4;
    return { n, lo, hi, W: X0 + 2 * n * CW + 10, H: (hi - lo + 1) * RH + 40 };
  });
  const y = (m: number) => 6 + (geo!.hi - m) * RH;

  /** Note names on the left, one per pitch in use (the last spelling wins). */
  const pitchLabels = $derived.by(() => {
    const used: Record<number, string> = {};
    for (const x of c.lines.flat()) if (x) used[x.midi] = x.n;
    return Object.entries(used).map(([m, n]) => [+m, n] as const);
  });

  function pos(i: number, k: number) {
    const v = c.voices[i];
    const o = oneNotePerBar(v);
    const u = o ? 2 * k : k;
    const w = o || k === c.lines[i].length - 1 ? 2 : 1;
    return { x: X0 + u * CW + 2, w: w * CW - 6, u };
  }

  function point(e: PointerEvent) {
    const r = svg!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function onDown(e: PointerEvent) {
    if (!geo) return;
    const [x, py] = point(e);
    const h = Math.floor((x - X0) / CW);
    if (h < 0 || h >= 2 * geo.n) return;
    // Clicking within a semitone of another voice's note selects that voice.
    const m = geo.hi - Math.floor((py - 6) / 10);
    let vi = c.active;
    let best = 99;
    c.voices.forEach((_, i) => {
      const k = c.slotAt(i, h);
      const note = k < 0 ? null : c.lines[i][k];
      if (!note) return;
      const d = Math.abs(note.midi - m);
      if (d < best && d <= 1) {
        best = d;
        vi = i;
      }
    });
    c.active = vi;
    frozen = { lo: geo.lo, hi: geo.hi };
    drag = { vi, h };
    svg!.setPointerCapture(e.pointerId);
    place(e);
  }

  function place(e: PointerEvent) {
    if (!drag || !geo) return;
    const [, py] = point(e);
    const k = c.slotAt(drag.vi, drag.h);
    if (k < 0) return;
    c.place(drag.vi, k, Math.max(geo.lo, Math.min(geo.hi, geo.hi - Math.floor((py - 6) / RH))));
  }

  function onUp() {
    if (!drag) return;
    drag = null;
    frozen = null;
  }
</script>

<svg
  bind:this={svg}
  role="img"
  aria-label={m.ct_roll()}
  class="block cursor-crosshair touch-pan-x [&_text]:fill-fg-faint [&_text]:[font:10px_var(--font-mono)]"
  width={geo?.W ?? 10}
  height={geo?.H ?? 10}
  viewBox={geo ? `0 0 ${geo.W} ${geo.H}` : undefined}
  onpointerdown={onDown}
  onpointermove={place}
  onpointerup={onUp}
  onpointercancel={onUp}
>
  {#if geo}
    {#each { length: geo.hi - geo.lo + 1 }, j (j)}
      {@const m = geo.lo + j}
      {#if LET[((m % 12) + 12) % 12]}
        <line
          x1={X0}
          x2={geo.W - 6}
          y1={y(m) + RH / 2}
          y2={y(m) + RH / 2}
          stroke="var(--color-line)"
          stroke-width="0.6"
        />
      {/if}
    {/each}
    {#each pitchLabels as [m, name] (m)}
      <text x="4" y={y(m) + RH - 1}>{name}</text>
    {/each}
    {#each { length: geo.n + 1 }, i (i)}
      <line
        x1={X0 + i * 2 * CW - 2}
        x2={X0 + i * 2 * CW - 2}
        y1="2"
        y2={geo.H - 30}
        stroke="var(--color-line)"
        stroke-dasharray="2 3"
      />
    {/each}
    {#each c.voices as v, i (i)}
      {#each c.lines[i] as p, k (k)}
        {@const q = pos(i, k)}
        {#if p && q.u < 2 * geo.n}
          <rect
            x={q.x}
            y={y(p.midi) + 1}
            width={q.w}
            height={RH - 2}
            rx="2"
            fill={VOICE_COLORS[i]}
            stroke={i === c.active ? 'var(--color-gold)' : 'none'}
            stroke-width="1.5"
            opacity={v.on ? 1 : 0.35}
          />
          {#if i === c.active && i}
            {@const cn = c.lines[0][oneNotePerBar(v) ? k : Math.floor(k / 2)]}
            {#if cn}
              <text x={q.x + q.w / 2} y={geo.H - 12} text-anchor="middle"
                >{Math.abs(p.dia - cn.dia) + 1}</text
              >
            {/if}
          {/if}
        {/if}
      {/each}
    {/each}
    {#each c.issues as s, j (j)}
      {@const p = s.k < 0 ? null : c.lines[s.v]?.[s.k]}
      {#if p}
        {@const q = pos(s.v, s.k)}
        <circle
          cx={q.x + q.w / 2}
          cy={y(p.midi) + RH / 2}
          r={Math.min(q.w / 2 + 2, 12)}
          fill="none"
          stroke={s.s === 'erro' ? 'var(--color-red)' : 'var(--color-gold)'}
          stroke-width="1.8"
        />
      {/if}
    {/each}
    <line
      x1={c.head ?? 0}
      x2={c.head ?? 0}
      y1="0"
      y2={geo.H - 30}
      stroke="var(--color-gold)"
      stroke-width="1.5"
      style:display={c.head === null ? 'none' : undefined}
    />
  {/if}
</svg>
