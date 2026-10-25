<script lang="ts">
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
    class="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left font-mono text-2xs tracking-[0.2em] text-fg-faint uppercase after:h-px after:flex-1 after:bg-line after:content-[''] hover:text-fg-mid"
    aria-expanded={q.teacherOpen}
    aria-controls="teacher-panel"
    onclick={() => (q.teacherOpen = !q.teacherOpen)}
  >
    <span
      class={['inline-block transition-transform duration-150', q.teacherOpen && 'rotate-90']}
      aria-hidden="true">▸</span
    >
    Modo professor
    <span class="ml-1.5 bg-gold px-[7px] py-px text-2xs tracking-[0.1em] text-bg uppercase">
      sem pontuação
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
        Selecione qualquer acorde para demonstrar em aula. O acorde é carregado oculto — os alunos
        tentam identificar antes de revelar.
      </p>
      <OptsRow class="mt-0 mb-2.5">
        <TabBtn active={q.teacherQuality === 'major'} onclick={() => (q.teacherQuality = 'major')}>
          Maior
        </TabBtn>
        <TabBtn active={q.teacherQuality === 'minor'} onclick={() => (q.teacherQuality = 'minor')}>
          Menor
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
              ]}>{chord.aFunc}</span
            >
          </button>
        {/each}
      </div>
    </div>
  {/if}
</Panel>

<Panel label="Acorde atual">
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
        {q.chord.type.toUpperCase()}
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
        A = {q.chord.aFunc}
      </div>
    </div>
    <div class="text-right">
      <RevealBtn onclick={() => q.toggleReveal()}>
        {q.revealed ? 'Ocultar acorde' : 'Revelar acorde'}
      </RevealBtn>
    </div>
  </div>
</Panel>

<Panel label="Reprodução">
  <div class="grid grid-cols-2 gap-2">
    <Btn onclick={() => q.playA()}>♩ Tocar Lá (A)</Btn>
    <Btn onclick={() => q.playChord()}>♬ Tocar acorde</Btn>
    <Btn primary onclick={() => q.newRandom()}>↻ Novo acorde aleatório</Btn>
  </div>
  <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
    <span class="text-xs tracking-[0.05em] text-fg-faint">Sortear:</span>
    <TabBtn active={q.randPool === 'both'} onclick={() => (q.randPool = 'both')}>
      Maior + Menor
    </TabBtn>
    <TabBtn active={q.randPool === 'major'} onclick={() => (q.randPool = 'major')}>
      Só maiores
    </TabBtn>
    <TabBtn active={q.randPool === 'minor'} onclick={() => (q.randPool = 'minor')}>
      Só menores
    </TabBtn>
  </div>
  <OptsRow>
    <OptsLabel>Oitava do A:</OptsLabel>
    <select bind:value={() => String(q.octave), (v) => (q.octave = parseInt(v))}>
      <option value="3">A3 — 220 Hz</option>
      <option value="4">A4 — 440 Hz</option>
      <option value="5">A5 — 880 Hz</option>
    </select>
    <OptsLabel class="ml-2">Vol:</OptsLabel>
    <input type="range" min="0" max="100" bind:value={audio.volume} />
  </OptsRow>
</Panel>

<Panel label="Qual acorde está tocando?">
  <OptsRow class="mt-0 mb-2.5">
    <TabBtn active={q.guessPool === 'major'} onclick={() => q.setGuessPool('major')}>Maior</TabBtn>
    <TabBtn active={q.guessPool === 'minor'} onclick={() => q.setGuessPool('minor')}>Menor</TabBtn>
    <TabBtn active={q.guessPool === 'both'} onclick={() => q.setGuessPool('both')}>Ambos</TabBtn>
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

<Panel label="Qual função o A exerce?">
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
    Verificar função
  </CheckBtn>
  <Feedback result={q.funcFeedback} />
</Panel>
