<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import PanelLabel from './PanelLabel.svelte';

  interface Props {
    label?: string;
    /** Extra content in the label row, after the text. */
    labelExtra?: Snippet;
    class?: ClassValue;
    /** Replaces the default padding. */
    padding?: ClassValue;
    children: Snippet;
  }

  let {
    label,
    labelExtra,
    class: cls,
    padding = 'px-[1.6rem] py-[1.4rem]',
    children
  }: Props = $props();
</script>

<div class={['animate-fade-up border border-line bg-surface', padding, cls]}>
  {#if label}
    <PanelLabel>{label}{@render labelExtra?.()}</PanelLabel>
  {/if}
  {@render children()}
</div>
