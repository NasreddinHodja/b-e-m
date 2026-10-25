<script lang="ts">
  import type { Answer } from '#lib/session/score.svelte.js';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    answers: Answer[];
    /** Show the module tag column (full history only). */
    showTag?: boolean;
    class?: ClassValue;
  }

  let { answers, showTag = false, class: cls = 'max-h-[180px]' }: Props = $props();
</script>

<div class={['flex flex-col gap-[3px] overflow-y-auto', cls]}>
  {#each answers as a (a.id)}
    <div
      class="flex items-center gap-2 border-b border-line py-[5px] text-sm text-fg-mid last:border-none"
    >
      <span class={['size-1.5 shrink-0 rounded-full', a.correct ? 'bg-green' : 'bg-red']}></span>
      {#if showTag}
        <span class="min-w-3.5 text-2xs tracking-[0.05em] text-fg-faint uppercase">{a.tag}</span>
      {/if}
      <span class="min-w-[70px] font-medium text-fg">{a.prompt}</span>
      <span class="flex-1">{a.answer}</span>
      <span class="text-2xs text-fg-faint">{a.time}</span>
    </div>
  {:else}
    <div class="py-1.5 text-sm text-fg-faint italic">Nenhuma resposta ainda.</div>
  {/each}
</div>
