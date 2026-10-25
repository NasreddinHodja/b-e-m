<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { session } from '#lib/backend/session.svelte.js';
  import { NAV } from '#lib/nav.js';
  import Sidebar from './Sidebar.svelte';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();

  let sidebarOpen = $state(false);

  const wide = $derived(
    NAV.some((g) => g.items.some((i) => i.wide && page.url.pathname === resolve(i.route)))
  );

  $effect(() => {
    if (session.status === 'signed-out') void goto(resolve('/login'));
  });

  afterNavigate(() => {
    if (window.innerWidth <= 768) sidebarOpen = false;
  });
</script>

{#if session.status === 'signed-in'}
  <!-- The left padding keeps the content clear of the fixed sidebar; main centers in the rest. -->
  <div class="min-h-screen w-full md:pl-[220px]">
    <button
      type="button"
      class="fixed top-3.5 left-3.5 z-300 hidden size-10 flex-col items-center justify-center gap-[5px] border border-line-lt bg-surface max-md:flex"
      aria-label="Menu"
      onclick={() => (sidebarOpen = !sidebarOpen)}
    >
      {#each [0, 1, 2] as i (i)}
        <span
          class={[
            'block h-[1.5px] w-[18px] bg-fg transition-all duration-[220ms]',
            sidebarOpen && i === 0 && '[transform:rotate(45deg)_translate(4px,4px)]',
            sidebarOpen && i === 1 && 'opacity-0',
            sidebarOpen && i === 2 && '[transform:rotate(-45deg)_translate(4px,-4px)]'
          ]}
        ></span>
      {/each}
    </button>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class={['fixed inset-0 z-190 bg-black/60', sidebarOpen ? 'block' : 'hidden']}
      onclick={() => (sidebarOpen = false)}
    ></div>

    <Sidebar open={sidebarOpen} />

    <main
      class={[
        'mx-auto min-w-0 px-[1.8rem] pt-8 pb-20 max-md:max-w-full max-md:px-4 max-md:pt-18',
        wide ? 'max-w-[1320px]' : 'max-w-[780px]'
      ]}
    >
      <div class="flex flex-col gap-[1.2rem]">
        {@render children()}
      </div>
    </main>
  </div>
{/if}
