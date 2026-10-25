<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    active?: boolean;
    children: Snippet;
  }

  let { active = false, class: cls, children, ...rest }: Props = $props();
</script>

<button
  type="button"
  class={[
    'border px-[11px] py-1 font-mono text-xs tracking-[0.05em] transition-all duration-[120ms]',
    active
      ? 'border-accent bg-accent text-bg'
      : 'border-line bg-transparent text-fg-mid hover:border-fg-mid hover:text-fg',
    cls
  ]}
  {...rest}
>
  {@render children()}
</button>
