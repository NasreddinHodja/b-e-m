<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  // First: it makes getLocale() reactive before anything renders a message.
  import '#lib/i18n.svelte.js';
  import './layout.css';
  import { session } from '#lib/backend/session.svelte.js';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();

  void session.start();
</script>

<svelte:head><title>{m.page_title()}</title></svelte:head>

{#if session.status === 'loading' || session.status === 'unreachable'}
  <div
    class="fixed inset-0 z-10000 flex flex-col items-center justify-center bg-bg text-sm tracking-[2px] text-gold"
  >
    {#if session.status === 'loading'}
      {m.boot_loading()}
    {:else}
      <div class="max-w-[440px] px-6 text-center leading-[1.9]">
        {m.boot_unreachable_title()}<br />
        <span class="text-xs tracking-[.06em] text-fg-mid">{m.boot_unreachable_help()}</span>
      </div>
    {/if}
  </div>
{:else}
  {@render children()}
{/if}
