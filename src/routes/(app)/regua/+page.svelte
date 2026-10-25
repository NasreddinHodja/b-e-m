<script lang="ts">
  import { REFERENCES, REGUA, type Tone } from '#lib/features/regua/intervals.js';
  import { regua } from '#lib/features/regua/regua.svelte.js';

  const TONE: Record<Tone, string> = {
    green: 'text-green border-green',
    gold: 'text-gold border-gold',
    red: 'text-red border-red'
  };
  const DOT: Record<Tone, string> = { green: 'bg-green', gold: 'bg-gold', red: 'bg-red' };
  const caption = 'text-2xs tracking-[0.12em] text-fg-faint uppercase';
</script>

<div
  class="flex flex-col gap-[1.2rem] border border-line bg-[#0a0a0a] px-[1.2rem] py-[1.4rem] font-mono"
>
  <div>
    <div class="mb-[0.6rem] flex items-center justify-between">
      <span class="font-display text-[22px] font-black tracking-[-0.01em] text-accent">B.E.M</span>
      <span class="text-2xs tracking-[0.18em] text-fg-faint uppercase"
        >SISTEMA DE PERCEPÇÃO MUSICAL</span
      >
    </div>
    <div>
      <div class="mb-1 text-[18px] text-fg-faint">—</div>
      <div class="font-display text-[32px] leading-none font-black tracking-[0.02em] text-accent">
        RÉGUA DE<br />INTERVALOS
      </div>
      <div class={[caption, 'mt-1.5 leading-[1.5]']}>
        MAPA ESPACIAL DA<br />PERCEPÇÃO INTERVALAR
      </div>
    </div>
  </div>

  <div class="flex items-start gap-4">
    <div class="min-w-[90px] shrink-0 border border-line-lt p-[0.8rem]">
      <div class="mb-1.5 text-3xs tracking-[0.12em] text-fg-faint uppercase">
        NOTA DE REFERÊNCIA
      </div>
      <div class="font-display text-[36px] leading-none font-black text-accent">
        {regua.reference.name}<sub class="text-[18px] text-fg-mid">4</sub>
      </div>
      <div class="mt-1 mb-2.5 text-3xs tracking-[0.1em] text-fg-faint uppercase">
        {regua.reference.label}
      </div>
      <div class="flex flex-col gap-[3px]">
        {#each REFERENCES as ref (ref.name)}
          {@const active = regua.reference.name === ref.name}
          <button
            type="button"
            class={[
              'border px-2 py-[3px] text-left font-mono text-xs transition-all duration-[120ms]',
              active
                ? 'border-accent bg-accent/5 text-accent'
                : 'border-line bg-transparent text-fg-mid hover:border-fg-mid hover:text-fg'
            ]}
            onclick={() => (regua.reference = ref)}
          >
            {ref.name}
          </button>
        {/each}
      </div>
    </div>

    <div class="flex shrink-0 flex-col items-center">
      <div class="py-[3px] text-2xs tracking-[0.06em] text-fg-faint">+12</div>
      <div class="relative flex flex-col-reverse">
        {#each REGUA as iv, idx (iv.semitones)}
          {@const playing = regua.playing.has(idx)}
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
          <div
            class={[
              'group relative flex h-11 cursor-pointer items-center',
              iv.tritone && 'border-y border-red/15 bg-red/4'
            ]}
            onclick={() => regua.play(idx)}
          >
            <div class="absolute top-0 left-3.5 h-full w-px bg-line"></div>
            <div
              class={[
                'relative z-1 mr-1.5 size-2.5 shrink-0 cursor-pointer rounded-full border-[1.5px] bg-transparent transition-[transform,box-shadow] duration-150',
                TONE[iv.tone],
                // The pulse animation drives the transform while playing.
                playing
                  ? 'animate-regua-pulse shadow-[0_0_12px_currentColor]'
                  : 'group-hover:[transform:scale(1.5)] group-hover:shadow-[0_0_8px_currentColor]'
              ]}
            ></div>
          </div>
        {/each}
      </div>
      <div class="py-[3px] text-2xs tracking-[0.06em] text-fg-faint">0</div>
    </div>

    <div class="flex flex-1 flex-col-reverse">
      {#each REGUA as iv, idx (iv.semitones)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div
          class={[
            'flex h-11 cursor-pointer items-center gap-[0.6rem] border-b border-white/4 px-1 transition-[background] duration-[120ms]',
            iv.tritone ? 'bg-red/4' : regua.playing.has(idx) ? 'bg-accent/6' : 'hover:bg-white/3'
          ]}
          onclick={() => regua.play(idx)}
        >
          <div class="flex min-w-[70px] flex-col">
            <span class="text-2xs leading-[1.2] tracking-[0.08em] text-fg-mid uppercase"
              >{iv.full}</span
            >
            <span
              class={[
                'font-display text-[20px] leading-none font-bold tracking-[-0.01em]',
                TONE[iv.tone]
              ]}>{iv.symbol}</span
            >
          </div>
          <span class={['min-w-5 text-center text-md font-bold', TONE[iv.tone]]}>
            {iv.semitones}
          </span>
          <span class={['flex-1 text-right text-3xs tracking-[0.1em] uppercase', TONE[iv.tone]]}>
            {iv.quality}
          </span>
        </div>
      {/each}
    </div>
  </div>

  <div class="flex flex-wrap items-center gap-4">
    <div class={[caption, 'mr-2']}>LEGENDA</div>
    {#each [['green', 'CONSONÂNCIA ESTÁVEL'], ['gold', 'CONSONÂNCIA NEUTRA'], ['red', 'DISSONÂNCIA']] as [tone, text] (tone)}
      <div class="flex items-center gap-1.5 text-2xs tracking-[0.1em] text-fg-faint uppercase">
        <span class={['size-2 rounded-full', DOT[tone as Tone]]}></span>{text}
      </div>
    {/each}
  </div>

  <div class="flex items-center gap-4">
    <span class="shrink-0 text-3xs tracking-[0.1em] text-fg-faint uppercase"
      >ESCALA DE SEMITONS</span
    >
    <div
      class="relative flex max-w-[200px] flex-1 before:absolute before:top-1/2 before:right-0 before:left-0 before:h-px before:bg-line-lt before:content-['']"
    >
      {#each [0, 2, 4, 6, 8, 10, 12] as n (n)}
        <span class="relative flex-1 text-left text-3xs text-fg-faint">{n}</span>
      {/each}
    </div>
  </div>

  <div
    class="flex items-center gap-[0.8rem] border border-line bg-surface-2 px-4 py-[0.8rem] text-2xs leading-[1.5] tracking-[0.1em] text-fg-faint uppercase"
  >
    <span class="shrink-0 text-[18px] text-fg-mid">◉</span>
    <span>
      {#if regua.last}
        {regua.last.full} ({regua.last.symbol}) — {regua.last.semitones} semitons<br />{regua.last
          .quality}
      {:else}
        TOQUE EM QUALQUER INTERVALO<br />PARA INTERNALIZAR SUA DISTÂNCIA SONORA.
      {/if}
    </span>
    <button
      type="button"
      class="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full border border-line-lt bg-surface text-base text-fg transition-all duration-[140ms] hover:border-accent hover:bg-accent hover:text-bg"
      onclick={() => regua.togglePlayAll()}
    >
      ▶
    </button>
  </div>
</div>
