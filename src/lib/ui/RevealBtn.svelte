<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let { children, ...rest }: HTMLButtonAttributes & { children: Snippet } = $props();
</script>

<button
  type="button"
  class="border border-line-lt bg-transparent px-[11px] py-1 text-xs tracking-[0.06em] text-fg-mid transition-all duration-[140ms] hover:border-fg-mid hover:text-fg"
  {...rest}
>
  {@render children()}
</button>
