<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import Play from '@lucide/svelte/icons/play';
  import Square from '@lucide/svelte/icons/square';
  import { metronome } from '#lib/features/pratica/metronome.svelte.js';
  import Btn from '#lib/ui/Btn.svelte';
  import OptsRow from '#lib/ui/OptsRow.svelte';
  import Panel from '#lib/ui/Panel.svelte';
</script>

<Panel label={m.metro_title()} class="max-w-[520px]">
  <div
    class="mb-[0.3rem] font-serif text-[64px] leading-none font-bold tracking-[-0.03em] text-accent"
  >
    {metronome.bpm}
  </div>
  <div class="mb-[0.8rem] text-xs tracking-[0.1em] text-fg-faint">BPM</div>
  <div class="my-[0.6rem] flex gap-2">
    {#each [0, 1, 2, 3] as i (i)}
      <div
        class={[
          'size-[11px] rounded-full transition-[background] duration-50',
          metronome.lit === i ? 'bg-gold shadow-[0_0_8px_var(--color-gold)]' : 'bg-line-lt'
        ]}
      ></div>
    {/each}
  </div>
  <input
    type="range"
    min="40"
    max="220"
    class="my-[0.6rem] w-full"
    value={metronome.bpm}
    oninput={(e) => metronome.setBpm(parseInt(e.currentTarget.value))}
  />
  <OptsRow class="mt-0">
    <Btn onclick={() => metronome.toggle()}
      >{#if metronome.active}<Square size={16} />{m.stop()}{:else}<Play
          size={16}
        />{m.start()}{/if}</Btn
    >
    <Btn onclick={() => metronome.tap()}>{m.metro_tap()}</Btn>
  </OptsRow>
</Panel>
