<script lang="ts">
  import type { Snippet } from 'svelte';

  /** One labelled control of the dictation form: `idx` is its two-digit number. */
  let {
    idx,
    label,
    full = false,
    children
  }: { idx: string; label: string; full?: boolean; children: Snippet } = $props();
</script>

<div class={['flex min-w-0 flex-col gap-[5px]', full && 'col-span-full']}>
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="flex items-center gap-1.5 text-2xs tracking-[0.16em] text-gold uppercase"
    ><span class="text-gold opacity-50">{idx}</span>{label}</label
  >
  {@render children()}
</div>
