<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    primary?: boolean;
    /** Replaces the default padding. */
    pad?: string;
    children: Snippet;
  }

  let {
    primary = false,
    pad = 'px-[0.6rem] py-[0.8rem]',
    class: cls,
    type = 'button',
    children,
    ...rest
  }: Props = $props();
</script>

<!-- A fill slides up from the bottom on hover. -->
<button
  {type}
  class={[
    'relative overflow-hidden border font-mono text-sm uppercase transition-all duration-[140ms]',
    "before:absolute before:inset-0 before:z-0 before:translate-y-[101%] before:transition-transform before:duration-[160ms] before:ease-[ease] before:content-['']",
    'hover:border-accent hover:text-bg hover:before:translate-y-0',
    primary
      ? 'border-accent bg-accent font-medium tracking-[0.14em] text-bg before:bg-fg-mid'
      : 'border-line-lt bg-transparent tracking-[0.08em] text-fg before:bg-accent',
    pad,
    cls
  ]}
  {...rest}
>
  <span class="relative z-1 inline-flex items-center justify-center gap-2"
    >{@render children()}</span
  >
</button>
