<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  let { class: cls, children }: { class?: ClassValue; children: Snippet } = $props();
</script>

<span class={['text-xs tracking-[0.05em] text-fg-faint', cls]}>{@render children()}</span>
