<script lang="ts">
  import type { FeedbackResult } from './types.js';

  /** Hidden while `result` is null. */
  let { result }: { result: FeedbackResult | null } = $props();
</script>

{#if result}
  <div
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
