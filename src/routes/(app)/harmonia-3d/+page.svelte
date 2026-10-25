<script lang="ts">
  import { getLocale } from '#lib/paraglide/runtime.js';
  import { m } from '#lib/paraglide/messages.js';
  import Play from '@lucide/svelte/icons/play';
  import Square from '@lucide/svelte/icons/square';
  import { onMount } from 'svelte';
  import { FIELDS, HEX, PRESETS, pretty } from '#lib/features/harmonia3d/fields.js';
  import { harmonia as h, type ViewName } from '#lib/features/harmonia3d/harmonia.svelte.js';
  import type { HarmoniaScene } from '#lib/features/harmonia3d/scene.js';
  import Btn from '#lib/ui/Btn.svelte';
  import OptsRow from '#lib/ui/OptsRow.svelte';
  import Panel from '#lib/ui/Panel.svelte';
  import TabBtn from '#lib/ui/TabBtn.svelte';

  let stage = $state<HTMLDivElement>();
  let canvas = $state<HTMLCanvasElement>();
  let labels = $state<HTMLDivElement>();
  /** What covers the stage instead of the scene, if anything. */
  let message = $state<'loading' | 'webgl' | 'library' | null>('loading');
  const MESSAGES = { loading: m.hg_loading, webgl: m.hg_no_webgl, library: m.hg_no_library };

  onMount(() => {
    let scene: HarmoniaScene | null = null;
    let gone = false;
    import('#lib/features/harmonia3d/scene.js')
      .then(({ HarmoniaScene }) => {
        if (gone) return;
        try {
          scene = new HarmoniaScene(h, stage!, canvas!, labels!);
          message = null;
        } catch {
          message = 'webgl';
        }
      })
      .catch(() => {
        message = 'library';
      });
    return () => {
      gone = true;
      // Leaving the page stops playback, as leaving the legacy tab did.
      h.stopPlay();
      scene?.destroy();
    };
  });

  const VIEW_BUTTONS: [ViewName, () => string][] = [
    ['front', m.hg_view_front],
    ['diag', m.hg_view_diag],
    ['side', m.hg_view_side],
    ['top', m.hg_view_top]
  ];
  const COLOR_VAR = {
    gold: 'var(--color-gold)',
    green: 'var(--color-green)',
    red: 'var(--color-red)',
    ivory: 'var(--color-accent)'
  };

  const progInfo = $derived.by(() => {
    if (!h.prog.length) return '';
    const total = h.timeline.total;
    const bars = total / 4;
    const p = {
      beats: total,
      // A decimal comma in Portuguese, a point in English.
      bars: Number.isInteger(bars)
        ? String(bars)
        : bars.toFixed(1).replace('.', getLocale() === 'pt-br' ? ',' : '.')
    };
    return bars === 1 ? m.hg_prog_info_one(p) : m.hg_prog_info(p);
  });

  const legend = $derived.by(() => {
    const dr = FIELDS[h.field].roman[h.degrees.findIndex((d) => d.dom)];
    return h.tetra
      ? [
          ['green', m.hg_legend_maj7(), m.hg_shape_maj7()],
          ['gold', m.hg_legend_m7(), m.hg_shape_m7()],
          ['red', m.hg_legend_dom7({ roman: dr }), m.hg_shape_dom7()],
          ['ivory', m.hg_legend_half_dim(), m.hg_shape_half_dim()]
        ]
      : [
          ['green', m.hg_legend_major(), m.hg_shape_major()],
          ['gold', m.hg_legend_minor(), m.hg_shape_minor()],
          ['red', m.hg_legend_dom({ roman: dr }), m.hg_shape_dom()],
          ['ivory', m.hg_legend_dim(), m.hg_shape_dim()]
        ];
  });

  /** Small polyline of a degree's block shape for its button. */
  function glyph(i: number) {
    const d = h.degrees[i];
    const k = 4;
    const A = [10, 6];
    const B = [10, 6 + d.v * k];
    const C = [10 + d.h * k, 6 + d.v * k];
    const D = [C[0], C[1] + d.s * k];
    return h.tetra ? [A, B, C, D] : [A, B, C];
  }

  const note = 'mt-2 text-sm leading-[1.6] text-fg-mid';
  const sub = 'mt-3.5 mb-1.5 text-xs tracking-[0.05em] text-fg-mid';
  const sideSelect = 'w-full px-2.5 py-1.5 text-sm';
  const hudBox = 'border border-line bg-[rgba(12,12,12,0.74)]';
</script>

<Panel label={m.hg_title()}>
  <p class="max-w-[680px] text-base leading-[1.8] text-fg-mid">
    {m.hg_intro()}
  </p>
  <p class="mt-[0.7rem] max-w-[680px] text-xs leading-[1.8] tracking-[0.14em] text-gold uppercase">
    {m.hg_motto()}
  </p>
</Panel>

<div class="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-[1.2rem] max-[1100px]:grid-cols-1">
  <div
    bind:this={stage}
    class="relative h-[660px] cursor-grab touch-none overflow-hidden border border-line bg-bg active:cursor-grabbing max-[1100px]:h-[520px]"
    aria-label={m.hg_stage()}
  >
    <canvas bind:this={canvas} class="absolute inset-0 block size-full"></canvas>
    <div bind:this={labels} class="pointer-events-none absolute inset-0 overflow-hidden"></div>
    <div
      class={[
        hudBox,
        'pointer-events-none absolute top-3 left-3 max-w-[280px] px-3 py-2 text-[10.5px] leading-[1.7] text-fg-soft max-[1100px]:hidden'
      ]}
    >
      <b class="mb-1 block text-2xs font-medium tracking-[0.2em] text-fg-mid uppercase"
        >{m.hg_axes()}</b
      >
      {#each [['accent', m.hg_axis_x()], ['accent', m.hg_axis_y()], ['gold', m.hg_axis_z()]] as [c, text] (text)}
        <div>
          <i class="mr-2 inline-block size-2 rounded-full" style:background="var(--color-{c})"
          ></i>{text}
        </div>
      {/each}
      <div class="mt-1 text-fg-mid">{m.hg_seventh_leg()}</div>
    </div>
    {#if message}
      <div
        class="absolute inset-0 z-2 grid place-items-center bg-bg p-6 text-center text-sm leading-[1.8] tracking-[0.08em] text-fg-mid"
      >
        {MESSAGES[message]()}
      </div>
    {/if}
    <p class={[hudBox, 'absolute right-3 bottom-2.5 left-3 px-2.5 py-1 text-xs text-fg-mid']}>
      {m.hg_controls()}
    </p>
  </div>

  <div class="flex flex-col gap-[1.2rem]">
    <Panel label={m.hg_field_key()}>
      <OptsRow class="mt-0">
        <TabBtn
          active={h.field === 'maj'}
          aria-pressed={h.field === 'maj'}
          onclick={() => h.setField('maj')}
        >
          {m.hg_field_major()}
        </TabBtn>
        <TabBtn
          active={h.field === 'min'}
          aria-pressed={h.field === 'min'}
          onclick={() => h.setField('min')}
        >
          {m.hg_field_minor()}
        </TabBtn>
      </OptsRow>
      <p class={sub}><label for="hgTonic">{m.hg_key()}</label></p>
      <select
        id="hgTonic"
        class={sideSelect}
        value={h.tonic}
        onchange={(e) => h.setTonic(e.currentTarget.value)}
      >
        {#each FIELDS[h.field].tonics as t (t)}
          <option value={t}
            >{pretty(t) +
              ' ' +
              (h.field === 'maj' ? m.acordes_type_major() : m.acordes_type_minor())}</option
          >
        {/each}
      </select>
      <p class={sub}>{m.hg_chords()}</p>
      <OptsRow class="mt-0">
        <TabBtn active={!h.tetra} aria-pressed={!h.tetra} onclick={() => h.setTetra(false)}>
          {m.hg_triads()}
        </TabBtn>
        <TabBtn active={h.tetra} aria-pressed={h.tetra} onclick={() => h.setTetra(true)}>
          {m.hg_sevenths()}
        </TabBtn>
      </OptsRow>
      <p class={note}>{m.hg_sevenths_note()}</p>
    </Panel>

    <Panel label={m.hg_degrees()}>
      <div class="grid grid-cols-4 gap-1.5">
        {#each h.degrees, i (i)}
          {@const c = COLOR_VAR[h.colorOf(i)]}
          {@const pts = glyph(i)}
          <button
            type="button"
            class="flex flex-col items-center border border-line-lt bg-bg px-0.5 pt-1.5 pb-[7px] font-mono leading-[1.2] text-fg [transition:border-color_0.14s,background_0.14s] hover:border-(--c) hover:bg-surface-2"
            style:--c={c}
            onclick={() => h.addChord(i)}
          >
            <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true" class="block">
              <polyline
                points={pts.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke={HEX[h.colorOf(i)]}
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
              {#each pts as p, j (j)}
                <circle cx={p[0]} cy={p[1]} r={j === 0 ? 3.2 : 2.3} fill={HEX[h.colorOf(i)]} />
              {/each}
            </svg>
            <span class="text-md font-medium" style:color={c}>{FIELDS[h.field].roman[i]}</span>
            <span class="text-xs text-fg-mid">{h.chordName(i)}</span>
          </button>
        {/each}
      </div>
      <p class={note}>{m.hg_degrees_note()}</p>
    </Panel>

    <Panel label={m.hg_progression()}>
      <select
        class={sideSelect}
        aria-label={m.hg_preset()}
        value={h.preset}
        onchange={(e) => h.choosePreset(e.currentTarget.value)}
      >
        {#each PRESETS, i (i)}<option value={String(i)}>{h.presetLabel(i)}</option>{/each}
        <option value="c">{m.hg_custom()}</option>
      </select>
      <p class="mt-3 min-h-10 text-base leading-[1.5] font-medium" aria-live="polite">
        {h.prog.length ? h.prog.map((e) => h.chordName(e.d)).join(' → ') : m.hg_empty()}
      </p>
      <p class={[note, 'mt-0!']}>{progInfo}</p>
      <p class={sub}>{m.hg_next_length()}</p>
      <OptsRow class="mt-0">
        {#each [1, 2, 4] as b (b)}
          <TabBtn active={h.dur === b} aria-pressed={h.dur === b} onclick={() => (h.dur = b)}>
            {(b === 1 ? m.hg_beat : m.hg_beats)({ n: b })}
          </TabBtn>
        {/each}
      </OptsRow>
      <p class={sub}>
        <label for="hgBpm">{m.hg_tempo()} <output>{h.bpm}</output> BPM</label>
      </p>
      <input
        type="range"
        id="hgBpm"
        min="50"
        max="160"
        class="my-2.5 w-full"
        value={h.bpm}
        oninput={(e) => h.setBpm(+e.currentTarget.value)}
      />
      <OptsRow>
        {#each [['play', h.playing ? m.stop() : m.play()], ['undo', m.undo()], ['clear', m.clear()]] as [id, text] (id)}
          <Btn
            primary={id === 'play'}
            class="flex-auto disabled:cursor-not-allowed disabled:opacity-30"
            disabled={!h.prog.length}
            onclick={() => (id === 'play' ? h.togglePlay() : id === 'undo' ? h.undo() : h.clear())}
            >{#if id === 'play'}{#if h.playing}<Square size={16} />{:else}<Play
                  size={16}
                />{/if}{/if}{text}</Btn
          >
        {/each}
      </OptsRow>
    </Panel>

    <Panel label={m.hg_view()}>
      <OptsRow class="mt-0">
        {#each VIEW_BUTTONS as [name, text] (name)}
          <TabBtn
            active={h.view === name}
            aria-pressed={h.view === name}
            onclick={() => h.setView(name)}
          >
            {text()}
          </TabBtn>
        {/each}
      </OptsRow>
      <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm text-fg-soft"
        ><input
          type="checkbox"
          class="size-3.5 accent-gold"
          checked={h.showMeasures}
          onchange={(e) => h.setShowMeasures(e.currentTarget.checked)}
        />
        {m.hg_measures()}</label
      >
    </Panel>

    <Panel label={m.hg_how_to_read()}>
      <ul
        class="flex list-none flex-col gap-2 text-sm leading-[1.6] text-fg-soft [&_b]:font-medium [&_b]:text-fg"
      >
        <li><b>X (vertical):</b> {m.hg_read_x()}</li>
        <li><b>Y (horizontal):</b> {m.hg_read_y()}</li>
        <li><b>{m.hg_read_z_label()}</b> {m.hg_read_z()}</li>
      </ul>
      <p class={note}>
        {m.hg_read_seventh()}
      </p>
      <ul class="mt-3.5 flex list-none flex-col gap-2.5">
        {#each legend as [c, title, detail] (c)}
          <li
            class="grid grid-cols-[16px_1fr] items-start gap-2.5 text-sm"
            style:--c={COLOR_VAR[c as keyof typeof COLOR_VAR]}
          >
            <i
              class="mt-0.5 block size-3.5 border border-(--c) bg-[color-mix(in_srgb,var(--c)_30%,transparent)]"
            ></i>
            <div><b>{title}</b><small class="block text-xs text-fg-mid">{detail}</small></div>
          </li>
        {/each}
      </ul>
    </Panel>
  </div>
</div>
