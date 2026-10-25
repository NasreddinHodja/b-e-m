<script lang="ts">
  import { intervalName, intervalShort, intervalSymbol } from '#lib/features/intervalos/labels.js';
  import { m } from '#lib/paraglide/messages.js';
  import EighthNote from '@lucide/svelte/icons/eighth-note';
  import EighthNotes from '@lucide/svelte/icons/eighth-notes';
  import Piano from '@lucide/svelte/icons/piano';
  import Shuffle from '@lucide/svelte/icons/shuffle';
  import { audio } from '#lib/audio/engine.svelte.js';
  import { INTERVALS } from '#lib/features/intervalos/intervals.js';
  import { intervalos as q } from '#lib/features/intervalos/quiz.svelte.js';
  import { score } from '#lib/session/score.svelte.js';
  import Btn from '#lib/ui/Btn.svelte';
  import CheckBtn from '#lib/ui/CheckBtn.svelte';
  import Feedback from '#lib/ui/Feedback.svelte';
  import HistoryList from '#lib/ui/HistoryList.svelte';
  import OptsLabel from '#lib/ui/OptsLabel.svelte';
  import OptsRow from '#lib/ui/OptsRow.svelte';
  import Panel from '#lib/ui/Panel.svelte';
  import PanelLabel from '#lib/ui/PanelLabel.svelte';
  import RevealBtn from '#lib/ui/RevealBtn.svelte';
  import TabBtn from '#lib/ui/TabBtn.svelte';
  import { markClass } from '#lib/ui/types.js';

  const answerCols = $derived.by(() => {
    const n = q.activeIntervals.length;
    return n <= 7 ? n : n <= 10 ? 5 : 7;
  });

  const blur = 'transition-[filter] duration-300';
  const pctColor = (pct: number) =>
    pct >= 70 ? 'text-green' : pct >= 40 ? 'text-gold' : 'text-red';
</script>

<Panel label={m.intervalos_current()}>
  <div class="flex items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-4">
        <div class="flex flex-col items-center gap-[3px]">
          <div class="font-serif text-[48px] leading-none font-bold text-accent">{q.noteA}</div>
          <div class="text-xs tracking-[0.08em] text-fg-faint">{m.intervalos_note1()}</div>
        </div>
        <div class="text-[20px] text-fg-faint">→</div>
        <div class="flex flex-col items-center gap-[3px]">
          <div
            class={[
              'font-serif text-[48px] leading-none font-bold text-accent',
              blur,
              !q.revealed && 'blur-[10px] select-none'
            ]}
          >
            {q.noteB}
          </div>
          <div class="text-xs tracking-[0.08em] text-fg-faint">{m.intervalos_note2()}</div>
        </div>
      </div>
      <div
        class={[
          'mt-1.5 border border-line-lt px-2 py-0.5 text-2xs tracking-[0.12em] text-fg-mid uppercase',
          q.directionShown ? 'inline-block' : 'hidden'
        ]}
      >
        {q.current.actualDir === 'asc' ? m.intervalos_asc_tag() : m.intervalos_desc_tag()}
      </div>
    </div>
    <div class="text-right">
      <div
        class={[
          'font-serif text-[20px] font-bold text-accent',
          blur,
          !q.revealed && 'blur-[8px] select-none'
        ]}
      >
        {intervalName(q.current.interval)}
      </div>
      <div class={['mt-[3px] text-sm text-fg-faint', blur, !q.revealed && 'blur-[5px]']}>
        {m.semitones_count({ n: q.current.interval.semitones })}
      </div>
      <div class="mt-2">
        <RevealBtn onclick={() => q.toggleReveal()}>
          {q.revealed ? m.intervalos_hide() : m.intervalos_reveal()}
        </RevealBtn>
      </div>
    </div>
  </div>
</Panel>

<Panel label={m.playback()}>
  <div class="grid grid-cols-4 gap-2">
    <Btn onclick={() => q.playNote1()}><EighthNote size={16} />{m.intervalos_play1()}</Btn>
    <Btn onclick={() => q.playNote2()}><EighthNote size={16} />{m.intervalos_play2()}</Btn>
    <Btn onclick={() => q.playSequence()}><EighthNotes size={16} />{m.intervalos_play_seq()}</Btn>
    <Btn onclick={() => q.playHarmonic()}><Piano size={16} />{m.intervalos_play_harm()}</Btn>
    <Btn primary class="col-span-full" onclick={() => q.next()}
      ><Shuffle size={16} />{m.intervalos_new()}</Btn
    >
  </div>
  <OptsRow>
    <OptsLabel>{m.intervalos_direction()}</OptsLabel>
    <TabBtn active={q.direction === 'asc'} onclick={() => (q.direction = 'asc')}
      >{m.intervalos_asc()}</TabBtn
    >
    <TabBtn active={q.direction === 'desc'} onclick={() => (q.direction = 'desc')}>
      {m.intervalos_desc()}
    </TabBtn>
    <TabBtn active={q.direction === 'both'} onclick={() => (q.direction = 'both')}
      >{m.intervalos_random_dir()}</TabBtn
    >
  </OptsRow>
  <OptsRow>
    <OptsLabel>{m.intervalos_root()}</OptsLabel>
    <select bind:value={q.rootMode}>
      <option value="fixed_A">{m.intervalos_root_a()}</option>
      <option value="fixed_C">{m.intervalos_root_c()}</option>
      <option value="random">{m.intervalos_root_random()}</option>
    </select>
    <OptsLabel class="ml-2">{m.volume()}</OptsLabel>
    <input type="range" min="0" max="100" bind:value={audio.volume} />
  </OptsRow>
</Panel>

<Panel label={m.intervalos_active()}>
  <div class="grid grid-cols-4 gap-1">
    {#each INTERVALS as iv (iv.semitones)}
      {@const on = q.active.has(iv.semitones)}
      <button
        type="button"
        aria-pressed={on}
        class={[
          'flex items-center gap-1.5 border px-2 py-[5px] text-left font-mono text-xs transition-all duration-[120ms] select-none',
          on
            ? 'border-fg bg-surface-2 text-fg'
            : 'border-line bg-bg text-fg-mid hover:border-fg-mid'
        ]}
        onclick={() => q.toggleFilter(iv.semitones)}
      >
        <span
          class={[
            'flex size-2.5 shrink-0 items-center justify-center border text-3xs',
            on ? 'border-accent bg-accent text-bg' : 'border-line-lt text-transparent'
          ]}>{on ? '✓' : ''}</span
        >
        <span>{intervalSymbol(iv)}</span>
        <span class="ml-auto text-2xs text-fg-faint">{iv.semitones}st</span>
      </button>
    {/each}
  </div>
  <OptsRow>
    <!-- The legacy markup lit "Todos" and never moved the highlight. -->
    <TabBtn active onclick={() => q.filterAll()}>{m.intervalos_all()}</TabBtn>
    <TabBtn onclick={() => q.filterGroup('consonant')}>{m.intervalos_consonant()}</TabBtn>
    <TabBtn onclick={() => q.filterGroup('dissonant')}>{m.intervalos_dissonant()}</TabBtn>
    <TabBtn onclick={() => q.filterGroup('diatonic')}>{m.intervalos_diatonic()}</TabBtn>
  </OptsRow>
</Panel>

<Panel label={m.intervalos_which()}>
  <div class="mb-3.5 grid gap-[5px]" style:grid-template-columns="repeat({answerCols}, 1fr)">
    {#each q.activeIntervals as iv (iv.semitones)}
      <button
        type="button"
        class={[
          'border border-line bg-bg px-[3px] pt-[7px] pb-[5px] text-center font-mono text-sm leading-[1.3] text-fg-mid transition-all duration-[120ms] hover:border-fg-mid hover:bg-surface-2',
          markClass(q.marks[iv.semitones], q.selectedShown && q.selected === iv.semitones)
        ]}
        onclick={() => q.select(iv.semitones)}
      >
        <span class="block text-base font-medium text-fg">{intervalSymbol(iv)}</span>
        <span class="mt-px block text-2xs text-fg-faint">{iv.semitones}st</span>
      </button>
    {/each}
  </div>
  <CheckBtn disabled={q.answered || q.selected === null} onclick={() => q.check()}>
    {m.check()}
  </CheckBtn>
  <Feedback result={q.feedback} />
</Panel>

<Panel label={m.intervalos_stats()}>
  <div
    class="mb-2.5 grid gap-px"
    style:grid-template-columns={q.statCols ? `repeat(${q.statCols}, 1fr)` : undefined}
  >
    {#each q.stats as { interval, pct } (interval.semitones)}
      <div class="border border-line bg-surface-2 px-2 py-[7px] text-center">
        <div class={['font-serif text-[18px] font-bold', pctColor(pct)]}>{pct}%</div>
        <div class="mt-px text-2xs tracking-[0.1em] text-fg-faint uppercase">
          {intervalShort(interval)}
        </div>
      </div>
    {:else}
      <div class="text-sm text-fg-faint italic">{m.intervalos_no_stats()}</div>
    {/each}
  </div>
  <PanelLabel class="my-4">{m.session_history()}</PanelLabel>
  <HistoryList answers={score.recent('i')} />
</Panel>
