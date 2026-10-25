<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import Panel from '#lib/ui/Panel.svelte';

  const TIPS = [
    [m.tip_0_title, m.tip_0_text],
    [m.tip_1_title, m.tip_1_text],
    [m.tip_2_title, m.tip_2_text],
    [m.tip_3_title, m.tip_3_text],
    [m.tip_4_title, m.tip_4_text]
  ];
</script>

<Panel label={m.ap_playlist()}>
  <div
    class="mb-4 border-l-2 border-gold px-[0.9rem] py-[0.7rem] text-sm leading-[1.7] text-fg-mid italic"
  >
    {m.ap_intro()}
  </div>
  <div class="overflow-hidden rounded-none border border-line">
    <iframe
      title={m.ap_iframe()}
      src="https://open.spotify.com/embed/playlist/3HvTNGj1RAWolEB1ojNDok?utm_source=generator&theme=0"
      width="100%"
      height="500"
      frameborder="0"
      allowfullscreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    ></iframe>
  </div>
</Panel>

<Panel label={m.ap_how()}>
  <div class="flex flex-col gap-2.5">
    {#each TIPS as [title, rest], i (i)}
      <div
        class="flex items-start gap-3 border-b border-line pb-2.5 text-base leading-[1.6] text-fg-mid last:border-none"
      >
        <span class="min-w-7 shrink-0 font-display text-[22px] leading-none font-bold text-fg-faint"
          >{String(i + 1).padStart(2, '0')}</span
        >
        <div><strong>{title()}</strong> — {rest()}</div>
      </div>
    {/each}
  </div>
</Panel>
