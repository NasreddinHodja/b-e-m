<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import Mic from '@lucide/svelte/icons/mic';
  import MicOff from '@lucide/svelte/icons/mic-off';
  import { tuner, type TunerMode } from '#lib/features/afinador/tuner.svelte.js';
  import Btn from '#lib/ui/Btn.svelte';
  import OptsRow from '#lib/ui/OptsRow.svelte';
  import Panel from '#lib/ui/Panel.svelte';

  const MODES: [TunerMode, () => string][] = [
    ['chromatic', m.tuner_chromatic],
    ['guitar', m.tuner_guitar],
    ['voice', m.tuner_voice]
  ];
  const READING = {
    blocked: { text: m.tuner_blocked, color: 'red' },
    inTune: { text: m.tuner_in_tune, color: 'green' },
    sharp: { text: m.tuner_sharp, color: 'gold' },
    flat: { text: m.tuner_flat, color: 'red' }
  } as const;
  const COLOR = { green: 'var(--color-green)', gold: 'var(--color-gold)', red: 'var(--color-red)' };

  const inTune = $derived(tuner.cents !== null && Math.abs(tuner.cents) < 5);
  const needleColor = $derived(
    tuner.cents === null
      ? 'bg-accent'
      : inTune
        ? 'bg-green'
        : tuner.cents > 0
          ? 'bg-gold'
          : 'bg-red'
  );

  /** Sparkline of recent cents readings, redrawn on every reading. */
  function sparkline(canvas: HTMLCanvasElement) {
    const history = tuner.history;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.clientWidth || canvas.width;
    const H = canvas.clientHeight || canvas.height;
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    if (history.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    history.forEach((c, i) => {
      const x = (i / (history.length - 1)) * W;
      const y = H / 2 - (c / 50) * (H / 2 - 4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    const last = Math.abs(history[history.length - 1]);
    ctx.strokeStyle = last < 5 ? '#4a9e6a' : last < 20 ? '#c8a030' : '#b84848';
    ctx.stroke();
  }
</script>

<div class="flex flex-col gap-[1.2rem]">
  {#if !tuner.on}
    <Panel label={m.tuner_title()} padding="px-4 py-8" class="text-center">
      <p class="mb-[1.2rem] text-base leading-[1.7] text-fg-mid">
        {m.tuner_intro_1()}<br />
        {m.tuner_intro_2()}
      </p>
      <Btn primary onclick={() => tuner.start()}><Mic size={16} />{m.tuner_start()}</Btn>
    </Panel>
  {:else}
    <!-- The legacy panels here sat in a plain block, without the column gap. -->
    <div>
      <Panel padding="pt-8 px-[1.4rem] pb-[1.6rem]" class="relative bg-[#060606]! text-center">
        <div
          class={[
            'font-display text-[88px] leading-none font-black tracking-[-0.02em] transition-[color] duration-200',
            inTune ? 'text-green' : 'text-accent'
          ]}
        >
          {#if tuner.noteName}{tuner.noteName}<sub class="text-[40px] text-fg-mid"
              >{tuner.octave}</sub
            >{:else}—{/if}
        </div>
        <div class="mt-[0.4rem] font-mono text-md tracking-[0.18em] text-fg-mid">
          {tuner.cents === null
            ? m.tuner_no_cents()
            : m.tuner_cents({
                cents: `${tuner.cents >= 0 ? '+' : ''}${Math.round(tuner.cents)}`
              })}
        </div>
        <div class="mt-1 text-xs tracking-[0.14em] text-fg-faint uppercase">
          {tuner.stability === null ? m.tuner_waiting() : m.tuner_stability({ n: tuner.stability })}
        </div>
        <div class="relative mx-auto mt-[1.4rem] mb-[0.6rem] max-w-[360px]">
          <div
            class="relative h-1 border border-line bg-surface-2 before:absolute before:inset-y-0 before:right-[44%] before:left-[44%] before:bg-green before:opacity-50 before:content-['']"
          >
            <div
              class={[
                'absolute -top-2 h-5 w-[3px] -translate-x-1/2 [transition:left_0.08s_cubic-bezier(0.25,0.46,0.45,0.94),background_0.2s]',
                needleColor
              ]}
              style:left="{tuner.needle}%"
            ></div>
          </div>
          <div class="mt-1.5 flex justify-between text-2xs tracking-[0.06em] text-fg-faint">
            <span>-50</span><span>-25</span><span>0</span><span>+25</span><span>+50</span>
          </div>
        </div>
        <div class="mt-[0.8rem] flex items-center justify-between">
          <span class="text-xs tracking-[0.14em] text-fg-faint uppercase"
            >{tuner.micOn ? m.tuner_mic_on() : m.tuner_mic_off()}</span
          >
          <span
            class="text-base font-medium tracking-[0.06em]"
            style:color={tuner.reading && tuner.reading !== 'blocked'
              ? COLOR[READING[tuner.reading].color]
              : undefined}>{tuner.reading ? READING[tuner.reading].text() : '—'}</span
          >
        </div>
      </Panel>
      <Panel label={m.tuner_history()} padding="px-[1.2rem] py-[0.8rem]">
        <div class="relative h-10 overflow-hidden border border-line bg-surface-2">
          <canvas {@attach sparkline} class="block size-full"></canvas>
        </div>
      </Panel>
      <Panel label={m.tuner_settings()}>
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs tracking-[0.08em] text-fg-faint">Ref. A =</span>
            <input
              class="w-[70px] border border-line-lt bg-bg px-2 py-1 text-center font-mono text-base text-fg outline-none"
              type="number"
              value={tuner.refFreq}
              min="415"
              max="466"
              step="1"
              oninput={(e) => (tuner.refFreq = parseFloat(e.currentTarget.value) || 440)}
            />
            <span class="text-xs tracking-[0.08em] text-fg-faint">Hz</span>
          </div>
          <div class="flex gap-1">
            {#each MODES as [mode, label] (mode)}
              <button
                type="button"
                class={[
                  'border px-2.5 py-1 text-xs tracking-[0.05em] transition-all duration-[120ms]',
                  tuner.mode === mode
                    ? 'border-accent bg-accent text-bg'
                    : 'border-line bg-transparent text-fg-mid'
                ]}
                onclick={() => tuner.setMode(mode)}
              >
                {label()}
              </button>
            {/each}
          </div>
        </div>
        <OptsRow>
          <Btn onclick={() => tuner.stop()}><MicOff size={16} />{m.tuner_stop()}</Btn>
        </OptsRow>
      </Panel>
    </div>
  {/if}
</div>
