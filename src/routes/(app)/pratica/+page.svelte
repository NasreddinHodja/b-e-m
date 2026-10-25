<script lang="ts">
  import Download from '@lucide/svelte/icons/download';
  import Pause from '@lucide/svelte/icons/pause';
  import Play from '@lucide/svelte/icons/play';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Trash from '@lucide/svelte/icons/trash';
  import { diario } from '#lib/features/pratica/diario.svelte.js';
  import { PILARES } from '#lib/features/pratica/pilares.js';
  import { pomodoro } from '#lib/features/pratica/pomodoro.svelte.js';
  import Btn from '#lib/ui/Btn.svelte';
  import OptsLabel from '#lib/ui/OptsLabel.svelte';
  import OptsRow from '#lib/ui/OptsRow.svelte';
  import Panel from '#lib/ui/Panel.svelte';
  import TabBtn from '#lib/ui/TabBtn.svelte';

  let titulo = $state('');
  let obs = $state('');

  function save(e: SubmitEvent) {
    e.preventDefault();
    const t = titulo.trim();
    const o = obs.trim();
    if (!t) return;
    void diario.add(t, o);
    titulo = '';
    obs = '';
  }

  function clearAll() {
    if (!confirm('Apagar todo o diário da nuvem? Isso não pode ser desfeito.')) return;
    void diario.clear();
  }

  const input =
    'block w-full resize-none border border-line-lt bg-bg px-[0.7rem] py-2 font-mono text-base text-fg outline-none transition-[border-color] duration-150 focus:border-fg-mid';
</script>

<Panel label="Os 10 Pilares do B.E.M">
  <div class="flex flex-col gap-2.5">
    {#each PILARES as p (p.titulo)}
      <div class="border-l-2 border-gold px-[0.9rem] py-2">
        <div class="text-base font-medium tracking-[0.04em] text-accent">{p.titulo}</div>
        <div class="mt-0.5 text-sm leading-[1.5] text-fg-mid">{p.desc}</div>
      </div>
    {/each}
  </div>
</Panel>

<Panel label="Diário de prática">
  <form onsubmit={save}>
    <input
      type="text"
      placeholder="O que eu estudei hoje?"
      class={[input, 'mb-1.5']}
      bind:value={titulo}
    />
    <textarea
      rows="2"
      placeholder="Como foi meu estudo hoje?"
      class={[input, 'mb-2']}
      bind:value={obs}></textarea>
    <div class="flex gap-1.5">
      <Btn type="submit">Registrar</Btn>
      <!-- The legacy inline style kept the red over the hover colors. -->
      <Btn class="border-red! text-red!" onclick={clearAll}>Apagar tudo</Btn>
      <Btn onclick={() => diario.exportJson()}><Download size={16} />JSON</Btn>
    </div>
  </form>
  <div class="mt-2.5 flex max-h-[180px] flex-col gap-[3px] overflow-y-auto">
    {#each diario.entries.slice(0, 20) as e, idx (e.id)}
      <div
        class="flex items-start gap-2 border-b border-line py-1.5 text-sm text-fg-mid last:border-none"
      >
        <span class="size-1.5 shrink-0 rounded-full bg-green"></span>
        <span class="flex-1">
          <strong>{e.titulo}</strong><br /><span class="text-xs text-fg-faint">{e.data}</span
          >{#if e.obs}<br />{e.obs}{/if}
        </span>
        <button
          type="button"
          class="ml-auto flex size-7 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent font-[inherit] text-md text-fg-faint opacity-50 transition-opacity duration-[120ms] hover:text-red hover:opacity-100"
          aria-label="Apagar registro"
          onclick={() => diario.remove(e.id, idx)}><Trash size={15} /></button
        >
      </div>
    {:else}
      <div class="py-1.5 text-sm text-fg-faint italic">Nenhum registro ainda.</div>
    {/each}
  </div>
</Panel>

<Panel label="Ciclo Pomodoro">
  <div
    class={[
      'mb-[0.4rem] font-serif text-[56px] leading-none font-bold tracking-[-0.02em]',
      pomodoro.done ? 'text-green' : pomodoro.running ? 'text-gold' : 'text-accent'
    ]}
  >
    {pomodoro.display}
  </div>
  <div class="mb-[0.8rem] text-xs tracking-[0.07em] text-fg-faint">{pomodoro.status}</div>
  <OptsRow class="mt-0">
    <Btn onclick={() => pomodoro.start()}><Play size={16} />Iniciar</Btn>
    <Btn onclick={() => pomodoro.stop()}><Pause size={16} />Parar</Btn>
    <Btn onclick={() => pomodoro.reset()}><RotateCcw size={16} />Reset</Btn>
  </OptsRow>
  <OptsRow>
    <OptsLabel>Ciclo:</OptsLabel>
    <TabBtn active={pomodoro.cycle === 25} onclick={() => pomodoro.setCycle(25)}>25 min</TabBtn>
    <TabBtn active={pomodoro.cycle === 50} onclick={() => pomodoro.setCycle(50)}>50 min</TabBtn>
  </OptsRow>
</Panel>
