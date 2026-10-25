<script lang="ts">
  import { prefersReducedMotion } from 'svelte/motion';
  import { slide } from 'svelte/transition';
  import type { FeedbackResult } from './types.js';

  /** Hidden while `result` is null; opens and closes with a height animation. */
  let { result }: { result: FeedbackResult | null } = $props();
</script>

{#if result}
  <div
    transition:slide={{ duration: prefersReducedMotion.current ? 0 : 220 }}
    class={[
      'mt-4 border-l-[3px] px-[1.2rem] py-4',
      result.ok ? 'border-green bg-green/6' : 'border-red bg-red/6'
    ]}
  >
    <div class={['mb-1 font-serif text-lg font-bold', result.ok ? 'text-green' : 'text-red']}>
      {result.title}
    </div>
    <div class="text-sm leading-[1.7] text-fg-mid">{result.explanation}</div>
    {#if result.theory !== undefined}<div>{result.theory}</div>{/if}
  </div>
{/if}
