<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import Check from '@lucide/svelte/icons/check';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Copy from '@lucide/svelte/icons/copy';
  import Download from '@lucide/svelte/icons/download';
  import EighthNote from '@lucide/svelte/icons/eighth-note';
  import Lock from '@lucide/svelte/icons/lock';
  import Play from '@lucide/svelte/icons/play';
  import Shuffle from '@lucide/svelte/icons/shuffle';
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
  import { prefersReducedMotion } from 'svelte/motion';
  import { slide } from 'svelte/transition';
  import { ditado as d } from '#lib/features/ditado/ditado.svelte.js';
  import { renderStaff } from '#lib/features/ditado/staff.js';
  import { rhythmSymbol } from '#lib/features/ditado/rhythm.js';
  import { TONICS, degreeOf } from '#lib/features/ditado/theory.js';
  import { score } from '#lib/session/score.svelte.js';
  import Btn from '#lib/ui/Btn.svelte';
  import HistoryList from '#lib/ui/HistoryList.svelte';
  import Panel from '#lib/ui/Panel.svelte';
  import PanelLabel from '#lib/ui/PanelLabel.svelte';
  import Field from './Field.svelte';

  /** Engrave the current exercise; re-runs when a new one is generated. */
  function staff(host: HTMLDivElement) {
    const current = d.current;
    const base = d.staffBaseMidi;
    if (current) renderStaff(host, current.model, base);
  }

  const ctrl =
    'min-h-[38px] w-full border border-line-lt bg-bg px-2.5 py-2 text-base text-fg outline-none focus:border-gold';
  const grid = 'grid grid-cols-2 gap-2.5 max-[480px]:grid-cols-1';
  const hint = 'py-1 text-sm text-fg-faint italic';
  const degrees = (o: string) =>
    o
      .split(',')
      .map((x) => degreeOf(parseInt(x)))
      .join(' – ');
  const s = d.settings;
  const HINTS = {
    start: m.ditado_hint_start,
    melodyFailed: m.ditado_hint_melody_failed,
    slonimskyFailed: m.ditado_hint_slonimsky_failed
  };
</script>

<Panel label={m.ditado_settings()}>
  <div class={grid}>
    <Field idx="01" label={m.ditado_mode()}>
      <select class={ctrl} bind:value={s.mode}>
        <option value="melody">{m.ditado_mode_melody()}</option>
        <option value="slonimsky">{m.ditado_mode_slonimsky()}</option>
      </select>
    </Field>
    <Field idx="02" label={m.ditado_key()}>
      <select class={ctrl} bind:value={s.key}>
        {#each TONICS as t, i (t)}<option value={String(i)}>{t}</option>{/each}
      </select>
    </Field>
    <Field idx="03" label={m.ditado_scale()}>
      <select class={ctrl} bind:value={s.scale}>
        <option value="major">{m.scale_major()}</option>
        <option value="minor">{m.scale_minor()}</option>
        <option value="harmonic">{m.scale_harmonic()}</option>
        <option value="melodic">{m.scale_melodic()}</option>
        <option value="pentMajor">{m.scale_pent_major()}</option>
        <option value="pentMinor">{m.scale_pent_minor()}</option>
        <optgroup label={m.scale_modes()}>
          <option value="ionian">{m.scale_ionian()}</option>
          <option value="dorian">{m.scale_dorian()}</option>
          <option value="phrygian">{m.scale_phrygian()}</option>
          <option value="lydian">{m.scale_lydian()}</option>
          <option value="mixolydian">{m.scale_mixolydian()}</option>
          <option value="aeolian">{m.scale_aeolian()}</option>
          <option value="locrian">{m.scale_locrian()}</option>
        </optgroup>
      </select>
    </Field>
    <Field idx="04" label={m.ditado_meter()}>
      <select class={ctrl} bind:value={s.meter}>
        <option>2/4</option>
        <option>3/4</option>
        <option>4/4</option>
        <option>6/8</option>
        <option>9/8</option>
        <option>12/8</option>
      </select>
    </Field>
  </div>

  <details class="group mt-3.5 border-t border-line pt-3">
    <summary
      class="flex cursor-pointer list-none items-center justify-between py-1 text-2xs tracking-[0.22em] text-fg-mid uppercase select-none group-open:text-gold [&::-webkit-details-marker]:hidden"
    >
      <span class="flex items-center gap-2"
        ><SlidersHorizontal size={14} />{m.ditado_advanced()}</span
      >
      <ChevronRight
        size={14}
        class="transition-transform duration-150 group-open:rotate-90 group-open:text-gold"
      />
    </summary>
    <div class="animate-[fade-up_0.18s_ease] pt-3">
      <div class={s.mode === 'melody' ? 'block' : 'hidden'}>
        <div class={grid}>
          <Field idx="05" label={m.ditado_bars()}>
            <input
              type="number"
              inputmode="numeric"
              min="1"
              max="8"
              class={ctrl}
              value={s.bars}
              oninput={(e) => (s.bars = e.currentTarget.value)}
            />
          </Field>
          <Field idx="06" label={m.ditado_rhythm()}>
            <select class={ctrl} bind:value={s.rhythm}>
              <option value="basic">{m.rhythm_basic()}</option>
              <option value="eighth">{m.rhythm_eighth()}</option>
              <option value="varied">{m.rhythm_varied()}</option>
              <option value="syncopated">{m.rhythm_syncopated()}</option>
            </select>
          </Field>
          <Field idx="07" label={m.ditado_range()}>
            <select class={ctrl} bind:value={s.range}>
              <option value="7">{m.interval_5th()}</option>
              <option value="12">{m.interval_8ve()}</option>
              <option value="16">{m.interval_10th()}</option>
            </select>
          </Field>
          <Field idx="08" label={m.ditado_max_leap()}>
            <select class={ctrl} bind:value={s.maxLeap}>
              <option value="5">{m.interval_4th()}</option>
              <option value="7">{m.interval_5th()}</option>
              <option value="12">{m.interval_8ve()}</option>
            </select>
          </Field>
          <Field idx="09" label={m.ditado_motion()}>
            <select class={ctrl} bind:value={s.motion}>
              <option value="step">{m.motion_step()}</option>
              <option value="mixed">{m.motion_mixed()}</option>
              <option value="leap">{m.motion_leap()}</option>
            </select>
          </Field>
          <Field idx="10" label={m.ditado_contour()}>
            <select class={ctrl} bind:value={s.contour}>
              <option value="mixed">{m.motion_mixed()}</option>
              <option value="asc">{m.contour_asc()}</option>
              <option value="desc">{m.contour_desc()}</option>
              <option value="arch">{m.contour_arch()}</option>
              <option value="wave">{m.contour_wave()}</option>
            </select>
          </Field>
          <Field idx="11" label={m.ditado_focus()} full>
            <select class={ctrl} bind:value={s.focus}>
              <option value="scale">{m.focus_scale()}</option>
              <option value="tonic">{m.focus_tonic()}</option>
              <option value="thirds">{m.focus_thirds()}</option>
              <option value="fourths">{m.focus_fourths()}</option>
              <option value="chromatic">{m.focus_chromatic()}</option>
            </select>
          </Field>
        </div>
      </div>

      <div class={s.mode === 'slonimsky' ? 'block' : 'hidden'}>
        <div class={grid}>
          <Field idx="12" label={m.ditado_pattern()} full>
            <input class={ctrl} inputmode="numeric" bind:value={s.pattern} />
          </Field>
          <Field idx="13" label={m.ditado_reps()}>
            <input
              type="number"
              inputmode="numeric"
              min="1"
              max="8"
              class={ctrl}
              value={s.reps}
              oninput={(e) => (s.reps = e.currentTarget.value)}
            />
          </Field>
          <Field idx="14" label={m.ditado_transform()}>
            <select class={ctrl} bind:value={s.transform}>
              <option value="original">{m.transform_original()}</option>
              <option value="retrograde">{m.transform_retrograde()}</option>
              <option value="inversion">{m.transform_inversion()}</option>
              <option value="retro-inv">{m.transform_retro_inv()}</option>
            </select>
          </Field>
        </div>
        <div class={hint}>{m.ditado_slonimsky_hint()}</div>
      </div>

      <div class={grid}>
        <Field idx="15" label={m.ditado_tempo()} full>
          <input
            type="number"
            inputmode="numeric"
            min="30"
            max="220"
            class={ctrl}
            value={s.bpm}
            oninput={(e) => (s.bpm = e.currentTarget.value)}
          />
        </Field>
      </div>
    </div>
  </details>
</Panel>

<Panel label={m.ditado_actions()}>
  <div class="grid grid-cols-2 gap-2">
    <Btn primary onclick={() => d.generate()}><Shuffle size={16} />{m.ditado_generate()}</Btn>
    <Btn onclick={() => d.play()}><Play size={16} />{m.ditado_listen()}</Btn>
    <Btn onclick={() => d.playRoot()}><EighthNote size={16} />{m.ditado_tonic()}</Btn>
    <Btn class="col-span-full" onclick={() => d.reveal()}>{m.reveal_answer()}</Btn>
  </div>
</Panel>

<Panel label={m.ditado_metric_map()}>
  {#snippet labelExtra()}
    <span
      class={[
        'text-right',
        d.staffBlurred
          ? 'text-2xs tracking-[0.2em] text-gold uppercase'
          : 'text-xs tracking-[0.1em] text-fg-faint'
      ]}>{d.metric}</span
    >
  {/snippet}
  <div class="relative">
    <div
      {@attach staff}
      class={[
        // Auto margins centre the staff both ways; when it's wider than the box they drop to 0, so it scrolls from its start.
        'flex min-h-[170px] overflow-x-auto border border-line bg-paper p-2 transition-[filter] duration-[350ms] ease-[ease] [-webkit-overflow-scrolling:touch] [&_svg]:m-auto [&_svg]:block [&_svg]:shrink-0',
        d.staffBlurred && 'pointer-events-none blur-[11px] saturate-[0.7] select-none'
      ]}
    ></div>
    <div
      class={[
        'pointer-events-none absolute inset-0 items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(12,12,12,0.35)_0%,rgba(12,12,12,0.15)_60%,transparent_85%)]',
        d.staffBlurred ? 'flex' : 'hidden'
      ]}
    >
      <!-- A dark chip: gold straight on the blurred paper was unreadable. -->
      <span
        class="flex items-center gap-2 border border-gold/40 bg-bg/90 px-3.5 py-2 text-xs tracking-[0.3em] text-gold uppercase"
        ><Lock size={14} />{m.ditado_locked()}</span
      >
    </div>
  </div>
</Panel>

<Panel label={m.ditado_challenge()}>
  {#if d.quiz.kind === 'hint'}
    <div class={hint}>{HINTS[d.quiz.reason]()}</div>
  {:else}
    {@const q = d.quiz}
    <div>
      {#each q.options as o (o)}
        {@const mark =
          q.picked === null ? null : o === q.correct ? 'correct' : o === q.picked ? 'wrong' : null}
        <button
          type="button"
          disabled={q.picked !== null}
          class={[
            'my-1.5 block min-h-[46px] w-full border bg-bg p-3.5 text-left font-mono text-md tracking-[0.06em] text-fg [transition:border-color_0.12s,color_0.12s,background_0.12s]',
            mark === 'correct'
              ? 'border-green bg-green/10 text-green'
              : mark === 'wrong'
                ? 'border-red bg-red/10 text-red'
                : 'border-line hover:border-gold hover:text-gold'
          ]}
          onclick={() => d.pick(o)}
        >
          {degrees(o)}
        </button>
      {/each}
    </div>
    {#if q.answerShown}
      <div class="mt-3 border-t border-line pt-3">
        <PanelLabel class="mb-2">{m.ditado_answer()}</PanelLabel>
        <div class="mb-2 font-mono text-lg tracking-[0.12em] text-fg">
          {#each d.current?.notes ?? [] as n, i (i)}{i > 0 ? ' – ' : ''}<span class="text-gold"
              >{degreeOf(n)}</span
            >{/each}
        </div>
        <div class="mt-2 flex flex-wrap gap-[5px]">
          {#each d.answerEvents as e, i (i)}
            <span class="border border-line px-2 py-[3px] text-sm text-gold"
              >{rhythmSymbol(e.dur)}</span
            >
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</Panel>

<div class="animate-fade-up border border-line bg-surface">
  <button
    type="button"
    class="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-[1.4rem] py-[1.1rem] text-left text-2xs tracking-[0.2em] text-gold uppercase"
    aria-expanded={d.lilyOpen}
    aria-controls="ditado-lily"
    onclick={() => (d.lilyOpen = !d.lilyOpen)}
  >
    <span>{m.ditado_lily_title()}</span>
    <ChevronRight
      size={14}
      class={['shrink-0 transition-transform duration-150', d.lilyOpen && 'rotate-90']}
    />
  </button>
  {#if d.lilyOpen}
    <div id="ditado-lily" transition:slide={{ duration: prefersReducedMotion.current ? 0 : 220 }}>
      <!-- Never filled in the legacy app either. -->
      <pre
        class="m-0 max-h-[240px] overflow-auto border-t border-line bg-well p-3 font-mono text-xs leading-[1.6] whitespace-pre-wrap text-[#cfcabd]"></pre>
      <div class="grid grid-cols-2 border-t border-line">
        <Btn
          class="[border-width:0_1px_0_0]! [border-color:var(--color-line)]!"
          pad="p-3"
          onclick={() => d.copyLily()}
          >{#if d.copied}<Check size={16} />{:else}<Copy size={16} />{/if}{d.copied
            ? m.copied()
            : m.copy_ly()}</Btn
        >
        <Btn class="[border-width:0]!" pad="p-3" onclick={() => d.downloadLily()}
          ><Download size={16} />{m.download_ly()}</Btn
        >
      </div>
    </div>
  {/if}
</div>

<Panel label={m.ditado_history()}>
  <HistoryList answers={score.recent('d')} />
</Panel>
