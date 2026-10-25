<script lang="ts">
  import { aFuncLabel, chordTypeLabel } from '#lib/features/acordes/labels.js';
  import { m } from '#lib/paraglide/messages.js';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import EighthNote from '@lucide/svelte/icons/eighth-note';
  import Piano from '@lucide/svelte/icons/piano';
  import Shuffle from '@lucide/svelte/icons/shuffle';
  import { prefersReducedMotion } from 'svelte/motion';
  import { slide } from 'svelte/transition';
  import { audio } from '#lib/audio/engine.svelte.js';
  import { TEACHER_CHORDS, FUNCS, chordPool, type Pool } from '#lib/features/acordes/chords.js';
  import { acordes as q } from '#lib/features/acordes/quiz.svelte.js';
  import Btn from '#lib/ui/Btn.svelte';
  import CheckBtn from '#lib/ui/CheckBtn.svelte';
  import Feedback from '#lib/ui/Feedback.svelte';
  import OptsLabel from '#lib/ui/OptsLabel.svelte';
  import OptsRow from '#lib/ui/OptsRow.svelte';
  import Panel from '#lib/ui/Panel.svelte';
  import RevealBtn from '#lib/ui/RevealBtn.svelte';
  import TabBtn from '#lib/ui/TabBtn.svelte';
  import { markClass } from '#lib/ui/types.js';

  const guessCols = (pool: Pool) => (pool === 'both' ? 6 : 5);
  const guessRows = (pool: Pool) => Math.ceil(chordPool(pool).length / guessCols(pool));
  const GUESS_ROWS = Math.max(...(['major', 'minor', 'both'] as const).map(guessRows));
  const guessFill = $derived(GUESS_ROWS * guessCols(q.guessPool) - chordPool(q.guessPool).length);

  const blur = 'transition-[filter] duration-300';
  const gridBtn =
    'border border-line bg-transparent font-mono text-xs text-fg-mid transition-all duration-[120ms] text-center hover:border-fg-mid hover:text-fg';
</script>

<!-- Collapsed by default: open, it shows which chord is loaded. -->
<Panel class="border-l-[3px] border-line-lt! border-l-gold! bg-gold/3!">
  <button
    type="button"
    class="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left text-2xs tracking-[0.2em] text-fg-faint uppercase after:h-px after:flex-1 after:bg-line after:content-[''] hover:text-fg-mid"
    aria-expanded={q.teacherOpen}
    aria-controls="teacher-panel"
    onclick={() => (q.teacherOpen = !q.teacherOpen)}
  >
    <ChevronRight
      size={14}
      class={['shrink-0 transition-transform duration-150', q.teacherOpen && 'rotate-90']}
    />
    {m.acordes_teacher()}
    <span class="ml-1.5 bg-gold px-[7px] py-px text-2xs tracking-[0.1em] text-bg uppercase">
      {m.acordes_no_score()}
    </span>
  </button>
  {#if q.teacherOpen}
    <div
      id="teacher-panel"
      class="pt-4"
      transition:slide={{ duration: prefersReducedMotion.current ? 0 : 220 }}
    >
      <p
        class="mb-2.5 border border-line bg-surface-2 px-[0.8rem] py-[0.6rem] text-sm leading-[1.6] text-fg-mid italic"
      >
        {m.acordes_teacher_help()}
      </p>
      <OptsRow class="mt-0 mb-2.5">
        <TabBtn active={q.teacherQuality === 'major'} onclick={() => (q.teacherQuality = 'major')}>
          {m.major()}
        </TabBtn>
        <TabBtn active={q.teacherQuality === 'minor'} onclick={() => (q.teacherQuality = 'minor')}>
          {m.minor()}
        </TabBtn>
      </OptsRow>
      <div class="grid grid-cols-6 gap-1 max-[500px]:grid-cols-4">
        {#each TEACHER_CHORDS[q.teacherQuality] as chord (chord.name)}
          {@const active = q.chord.name === chord.name}
          <button
            type="button"
            class={[
              'flex flex-col items-center gap-px border px-0.5 py-[5px] text-center font-mono text-xs transition-all duration-[120ms]',
              active
                ? 'border-accent bg-accent/5 text-accent'
                : 'border-line bg-transparent text-fg-mid hover:border-fg-mid hover:text-fg'
            ]}
            onclick={() => q.load(chord, true)}
          >
            <span class="text-base font-medium text-fg">{chord.name}</span>
            <span
              class={[
                'text-center text-3xs leading-[1.2] tracking-[0.04em]',
                chord.aFunc === '—' ? 'text-fg-faint' : 'text-gold'
              ]}>{aFuncLabel(chord)}</span
            >
          </button>
        {/each}
      </div>
    </div>
  {/if}
</Panel>

<Panel label={m.acordes_current()}>
  <div class="flex items-center justify-between gap-4">
    <div>
      <div
        class={[
          'font-serif text-[54px] leading-none font-bold tracking-[-0.04em] text-accent',
          blur,
          !q.revealed && 'blur-[9px] select-none'
        ]}
      >
        {q.chord.name}
      </div>
      <div class="mt-[3px] text-xs tracking-[0.1em] text-fg-mid uppercase">
        {chordTypeLabel(q.chord).toUpperCase()}
      </div>
      <div
        class={[
          'mt-1 text-sm tracking-[0.05em] text-fg-mid',
          blur,
          !q.revealed && 'blur-[6px] select-none'
        ]}
      >
        {q.chordNotes}
      </div>
      <!-- Always laid out, so revealing doesn't change the panel's height. -->
      <div
        class={[
          'mt-[7px] inline-block border border-gold/35 bg-gold/6 px-2.5 py-0.5 text-xs tracking-[0.1em] text-gold uppercase',
          !q.revealed && 'invisible'
        ]}
      >
        A = {aFuncLabel(q.chord)}
      </div>
    </div>
    <div class="text-right">
      <RevealBtn onclick={() => q.toggleReveal()}>
        {q.revealed ? m.acordes_hide() : m.acordes_reveal()}
      </RevealBtn>
    </div>
  </div>
</Panel>

<Panel label={m.playback()}>
  <div class="grid grid-cols-2 gap-2">
    <Btn onclick={() => q.playA()}><EighthNote size={16} />{m.acordes_play_a()}</Btn>
    <Btn onclick={() => q.playChord()}><Piano size={16} />{m.acordes_play_chord()}</Btn>
    <Btn primary onclick={() => q.newRandom()}><Shuffle size={16} />{m.acordes_new()}</Btn>
  </div>
  <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
    <span class="text-xs tracking-[0.05em] text-fg-faint">{m.acordes_draw()}</span>
    <TabBtn active={q.randPool === 'both'} onclick={() => (q.randPool = 'both')}>
      {m.acordes_draw_both()}
    </TabBtn>
    <TabBtn active={q.randPool === 'major'} onclick={() => (q.randPool = 'major')}>
      {m.acordes_draw_major()}
    </TabBtn>
    <TabBtn active={q.randPool === 'minor'} onclick={() => (q.randPool = 'minor')}>
      {m.acordes_draw_minor()}
    </TabBtn>
  </div>
  <OptsRow>
    <OptsLabel>{m.acordes_octave()}</OptsLabel>
    <select bind:value={() => String(q.octave), (v) => (q.octave = parseInt(v))}>
      <option value="3">A3 — 220 Hz</option>
      <option value="4">A4 — 440 Hz</option>
      <option value="5">A5 — 880 Hz</option>
    </select>
    <OptsLabel class="ml-2">{m.volume()}</OptsLabel>
    <input type="range" min="0" max="100" bind:value={audio.volume} />
  </OptsRow>
</Panel>

<Panel label={m.acordes_which_chord()}>
  <OptsRow class="mt-0 mb-2.5">
    <TabBtn active={q.guessPool === 'major'} onclick={() => q.setGuessPool('major')}
      >{m.major()}</TabBtn
    >
    <TabBtn active={q.guessPool === 'minor'} onclick={() => q.setGuessPool('minor')}
      >{m.minor()}</TabBtn
    >
    <TabBtn active={q.guessPool === 'both'} onclick={() => q.setGuessPool('both')}
      >{m.both()}</TabBtn
    >
  </OptsRow>
  <div class={['grid gap-1', guessCols(q.guessPool) === 6 ? 'grid-cols-6' : 'grid-cols-5']}>
    {#each chordPool(q.guessPool) as chord (chord.name)}
      <button
        type="button"
        class={[gridBtn, 'px-0.5 py-1.5', markClass(q.guessMarks[chord.name])]}
        onclick={() => q.guess(chord)}
      >
        {chord.name}
      </button>
    {/each}
    <!-- Invisible cells fill the grid to the most rows any pool needs, so switching pools keeps its height. -->
    {#each { length: guessFill }, i (i)}
      <span class={[gridBtn, 'invisible px-0.5 py-1.5']} aria-hidden="true">–</span>
    {/each}
  </div>
  <Feedback result={q.guessFeedback} />
</Panel>

<Panel label={m.acordes_which_func()}>
  <div class="mb-3 grid grid-cols-4 gap-1.5">
    {#each FUNCS as fn (fn)}
      <button
        type="button"
        class={[
          'border border-line-lt bg-transparent px-[0.3rem] py-[0.65rem] font-mono text-base font-medium tracking-[0.05em] text-fg-mid transition-all duration-[120ms] hover:border-fg hover:text-fg',
          markClass(q.funcMarks[fn], !q.funcAnswered && q.selectedFunc === fn)
        ]}
        onclick={() => q.selectFunc(fn)}
      >
        {fn}
      </button>
    {/each}
  </div>
  <CheckBtn disabled={q.funcAnswered || !q.selectedFunc} onclick={() => q.checkFunc()}>
    {m.acordes_check_func()}
  </CheckBtn>
  <Feedback result={q.funcFeedback} />
</Panel>
