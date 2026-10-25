<script lang="ts">
  import { language } from '#lib/i18n.svelte.js';
  import { m } from '#lib/paraglide/messages.js';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { audio } from '#lib/audio/engine.svelte.js';
  import { session } from '#lib/backend/session.svelte.js';
  import { NAV } from '#lib/nav.js';
  import { score } from '#lib/session/score.svelte.js';
  import BemLogo from '#lib/ui/BemLogo.svelte';
  import Headphones from '@lucide/svelte/icons/headphones';
  import LogOut from '@lucide/svelte/icons/log-out';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Speaker from '@lucide/svelte/icons/speaker';

  let { open }: { open: boolean } = $props();

  function resetScores() {
    if (!confirm(m.score_reset_confirm())) return;
    score.reset();
  }

  function badge(m: 'h' | 'i' | 'd') {
    const s = score.byModule[m];
    const total = s.correct + s.wrong;
    return total ? `${s.correct}/${total}` : '0';
  }

  const footerBtn =
    'flex w-full items-center justify-center gap-1.5 border-0 border-b border-line p-1.5 text-2xs tracking-[0.1em] uppercase transition-all duration-150';
  const modeBtn = (active: boolean) => [
    'flex flex-1 items-center justify-center gap-1.5 border px-1 py-[5px] text-xs tracking-[0.04em] transition-all duration-[120ms]',
    active
      ? 'border-line-lt bg-surface-2 text-accent'
      : 'border-line bg-transparent text-fg-faint hover:text-fg-mid'
  ];
</script>

<aside
  class={[
    'fixed top-0 left-0 z-200 flex h-screen w-[220px] flex-col overflow-x-hidden overflow-y-auto border-r border-line bg-surface transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
    !open && 'max-md:-translate-x-full'
  ]}
>
  <div class="flex items-center gap-2.5 border-b border-line px-[1.2rem] pt-[1.4rem] pb-[1.2rem]">
    <BemLogo />
    <div class="flex flex-col gap-0.5">
      <div class="text-2xs leading-[1.3] font-medium tracking-[0.14em] text-fg uppercase">
        {m.app_name()}
      </div>
      <div class="text-3xs tracking-[0.12em] text-fg-faint uppercase">
        {m.app_tagline()}
      </div>
    </div>
  </div>

  <div class="flex border-b border-line">
    {#each [{ v: score.total.correct, l: m.score_correct(), c: 'text-green' }, { v: score.total.wrong, l: m.score_wrong(), c: 'text-red' }] as cell (cell.c)}
      <div class="flex-1 border-r border-line px-2 py-2.5 text-center last:border-r-0">
        <span class={['block font-serif text-[20px] leading-none font-bold', cell.c]}>{cell.v}</span
        >
        <span class="mt-0.5 block text-3xs tracking-[0.12em] text-fg-faint uppercase">{cell.l}</span
        >
      </div>
    {/each}
  </div>
  <button
    type="button"
    class={[footerBtn, 'bg-transparent text-fg-faint hover:bg-red/6 hover:text-red']}
    onclick={resetScores}><RotateCcw size={13} />{m.score_reset()}</button
  >
  <button
    type="button"
    class={[footerBtn, 'bg-red/5 text-red hover:bg-red/15']}
    onclick={() => session.signOut()}><LogOut size={13} />{m.sign_out()}</button
  >

  <nav class="flex flex-1 flex-col py-2">
    {#each NAV as { group, items }, gi (gi)}
      <div
        class={[
          'px-[1.2rem] pt-4 pb-[0.35rem] text-3xs tracking-[0.22em] text-gold uppercase opacity-75',
          gi > 0 && 'mt-[0.4rem] border-t border-line'
        ]}
      >
        {group()}
      </div>
      {#each items as item (item.route)}
        {@const active = page.url.pathname === resolve(item.route)}
        <a
          href={resolve(item.route)}
          class={[
            'flex w-full items-center justify-between border-l-[3px] px-[1.2rem] py-3 text-left text-sm tracking-[0.1em] uppercase no-underline transition-all duration-[140ms]',
            active
              ? 'border-l-accent bg-accent/5 text-accent'
              : 'border-l-transparent text-fg-mid hover:bg-white/3 hover:text-fg'
          ]}
        >
          <span class="flex items-center gap-2.5"
            ><item.icon size={16} class="shrink-0 opacity-70" />{item.label()}</span
          >
          {#if item.badge}
            <span
              class={[
                'border px-[5px] py-px text-3xs',
                active ? 'border-gold bg-gold text-bg' : 'border-line bg-surface-2 text-fg-faint'
              ]}>{badge(item.badge)}</span
            >
          {/if}
        </a>
      {/each}
    {/each}
  </nav>

  <div class="flex gap-1 border-t border-line px-4 py-[0.8rem]">
    <button
      type="button"
      class={modeBtn(audio.mode === 'speaker')}
      onclick={() => audio.setMode('speaker')}
    >
      <Speaker size={14} />
      {m.output_speaker()}
    </button>
    <button
      type="button"
      class={modeBtn(audio.mode === 'headphone')}
      onclick={() => audio.setMode('headphone')}
    >
      <Headphones size={14} />
      {m.output_headphone()}
    </button>
  </div>
  <div class="flex gap-1 px-4 pb-[0.8rem]" role="group" aria-label={m.language()}>
    {#each language.all as locale (locale)}
      <button
        type="button"
        class={modeBtn(language.current === locale)}
        aria-pressed={language.current === locale}
        lang={locale === 'en' ? 'en' : 'pt-BR'}
        onclick={() => language.set(locale)}
      >
        {locale === 'en' ? 'EN' : 'PT'}
      </button>
    {/each}
  </div>
</aside>
