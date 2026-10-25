<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  let { class: cls = 'mt-2.5', children }: { class?: ClassValue; children: Snippet } = $props();
</script>

<div class={['flex flex-wrap items-center gap-[7px]', cls]}>
  {@render children()}
</div>
