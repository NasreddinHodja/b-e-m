<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  let { class: cls = 'mb-4', children }: { class?: ClassValue; children: Snippet } = $props();
</script>

<div
  class={[
    'flex items-center gap-2 text-2xs tracking-[0.2em] text-fg-faint uppercase',
    "after:h-px after:flex-1 after:bg-line after:content-['']",
    cls
  ]}
>
  {@render children()}
</div>
