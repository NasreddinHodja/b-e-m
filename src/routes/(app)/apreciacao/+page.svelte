<script lang="ts">
  import Panel from '#lib/ui/Panel.svelte';

  const TIPS = [
    ['Identifique a tônica', 'qual nota soa como "casa"?'],
    ['Localize a tríade tônica', 'ouça as notas dos tempos fortes.'],
    ['Rastreie movimentos melódicos', 'graus conjuntos? saltos?'],
    ['Sinta a tensão e o repouso', 'onde a música "quer ir"?'],
    ['Registre no diário', 'anote o que ouviu.']
  ];
</script>

<Panel label="Playlist — B.E.M Apreciação Musical">
  <div
    class="mb-4 border-l-2 border-gold px-[0.9rem] py-[0.7rem] text-sm leading-[1.7] text-fg-mid italic"
  >
    Escuta ativa como prática deliberada — ouça com atenção, identifique intervalos, funções
    harmônicas e movimentos melódicos.
  </div>
  <div class="overflow-hidden rounded-none border border-line">
    <iframe
      title="Playlist B.E.M no Spotify"
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

<Panel label="Como usar a escuta ativa">
  <div class="flex flex-col gap-2.5">
    {#each TIPS as [title, rest], i (title)}
      <div
        class="flex items-start gap-3 border-b border-line pb-2.5 text-base leading-[1.6] text-fg-mid last:border-none"
      >
        <span class="min-w-7 shrink-0 font-display text-[22px] leading-none font-bold text-fg-faint"
          >{String(i + 1).padStart(2, '0')}</span
        >
        <div><strong>{title}</strong> — {rest}</div>
      </div>
    {/each}
  </div>
</Panel>
