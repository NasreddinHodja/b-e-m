<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let { children, ...rest }: HTMLButtonAttributes & { children: Snippet } = $props();
</script>

<button
  type="button"
  class="w-full border border-line-lt bg-transparent p-[0.9rem] font-mono text-sm font-medium tracking-[0.12em] text-fg uppercase transition-all duration-[140ms] enabled:hover:border-accent enabled:hover:bg-accent enabled:hover:text-bg disabled:cursor-not-allowed disabled:opacity-[0.28]"
  {...rest}
>
  {@render children()}
</button>
