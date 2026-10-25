<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';
  import Download from '@lucide/svelte/icons/download';
  import Play from '@lucide/svelte/icons/play';
  import Square from '@lucide/svelte/icons/square';
  import X from '@lucide/svelte/icons/x';
  import { contraponto as c, voiceLabel } from '#lib/features/contraponto/contraponto.svelte.js';
  import type { Species } from '#lib/features/contraponto/rules.js';
  import Panel from '#lib/ui/Panel.svelte';
  import { VOICE_COLORS } from './colors.js';
  import Roll from './Roll.svelte';

  const btn =
    'inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-xs tracking-[0.08em] uppercase transition-all duration-[140ms] disabled:cursor-not-allowed disabled:opacity-35';
  const plain = [
    btn,
    'border-line-lt bg-transparent text-fg enabled:hover:border-accent enabled:hover:bg-accent enabled:hover:text-bg'
  ];
  const primary = [
    btn,
    'border-accent bg-accent text-bg enabled:hover:border-gold enabled:hover:bg-gold'
  ];
  const barLabel =
    'm-0 inline-flex items-center gap-1.5 font-mono text-xs font-medium tracking-[0.08em] text-fg-mid uppercase';
  const hint = 'mt-2.5 font-mono text-sm leading-[1.5] text-fg-faint';
  const well =
    'w-full border border-line-lt bg-well font-mono text-fg focus:border-gold focus:outline-none';
</script>

<Panel label={m.ct_title()}>
  <p class={[hint, 'mt-0!']}>
    {m.ct_intro()}
  </p>
  <div class="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-2">
    <button type="button" class={primary} onclick={() => c.play()}
      ><Play size={14} />{m.play()}</button
    >
    <button type="button" class={plain} onclick={() => c.stop()}
      ><Square size={14} />{m.stop()}</button
    >
    <label class={barLabel}
      >{m.tempo()}
      <input type="range" min="40" max="160" class="w-[100px]" bind:value={c.bpm} />
      <span>{c.bpm}</span>
    </label>
    <label class={barLabel}
      ><input type="checkbox" bind:checked={c.loop} />
      {m.ct_loop()}</label
    >
    <label class={barLabel}
      >{m.ct_accidental()}
      <select class="w-auto text-sm" bind:value={c.acc}>
        <option value="">{m.ct_natural()}</option>
        <option value="#">{m.ct_sharp()}</option>
        <option value="b">{m.ct_flat()}</option>
      </select>
    </label>
    <button type="button" class={plain} onclick={() => c.addMeasure()}>{m.ct_add_bar()}</button>
    <button type="button" class={plain} onclick={() => c.removeMeasure()}
      >{m.ct_remove_bar()}</button
    >
    <button type="button" class={plain} onclick={() => c.setExample(1)}>{m.ct_example_1()}</button>
    <button type="button" class={plain} onclick={() => c.setExample(2)}>{m.ct_example_2()}</button>
    <button type="button" class={plain} onclick={() => c.generateLily()}
      >{m.ct_generate_ly()}</button
    >
    <button type="button" class={plain} onclick={() => c.copyLily()}
      >{#if c.copied}<Check size={14} />{:else}<Copy size={14} />{/if}{c.copied
        ? m.copied()
        : m.copy_ly()}</button
    >
    <button type="button" class={plain} onclick={() => c.saveLily()}
      ><Download size={14} />{m.ct_save_ly()}</button
    >
  </div>
</Panel>

<div
  class="grid grid-cols-[minmax(0,340px)_minmax(0,1fr)] items-start gap-[1.2rem] max-[900px]:grid-cols-1"
>
  <Panel>
    <div>
      {#each c.voices as v, i (i)}
        <div
          class={[
            'mb-2.5 border bg-bg p-2.5',
            i === c.active ? 'border-gold shadow-[0_0_0_1px_var(--color-gold)]' : 'border-line'
          ]}
        >
          <div
            class="mb-2 flex flex-wrap items-center gap-2 font-mono text-sm font-semibold text-fg"
          >
            <input
              type="radio"
              name="ct-av"
              checked={i === c.active}
              aria-label={m.ct_edit_voice({ voice: voiceLabel(i) })}
              onchange={() => (c.active = i)}
            />
            <i
              class="inline-block size-2.5 shrink-0 rounded-[2px]"
              style:background={VOICE_COLORS[i]}
            ></i>
            <span class="flex-1">{voiceLabel(i)}</span>
            {#if !v.cf}
              <select
                class="w-auto px-1.5 py-0.5 text-sm"
                aria-label={m.ct_species()}
                value={String(v.sp)}
                onchange={(e) => c.setSpecies(i, +e.currentTarget.value as Species)}
              >
                <option value="1">{m.ct_species_1()}</option>
                <option value="2">{m.ct_species_2()}</option>
              </select>
            {/if}
            <label
              class="m-0 inline-flex cursor-pointer items-center gap-[5px] font-mono text-xs font-medium tracking-[0.06em] text-fg-mid uppercase"
              ><input type="checkbox" bind:checked={v.on} />{m.ct_sound()}</label
            >
            {#if !v.cf}
              <button
                type="button"
                class={plain}
                style:padding="4px 6px"
                title={m.ct_remove_voice_title()}
                aria-label={m.ct_remove_voice({ voice: voiceLabel(i) })}
                onclick={() => c.removeVoice(i)}><X size={14} /></button
              >
            {/if}
          </div>
          <textarea
            class={[well, 'min-h-[60px] resize-y p-2 text-base leading-[1.4]']}
            spellcheck="false"
            aria-label={m.ct_voice_notes({ voice: voiceLabel(i) })}
            value={v.txt}
            oninput={(e) => c.setText(i, e.currentTarget.value)}></textarea>
        </div>
      {/each}
    </div>
    <button type="button" class={plain} disabled={c.voices.length >= 4} onclick={() => c.addVoice()}
      >{m.ct_add_voice()}</button
    >
    <p class={hint}>
      {m.ct_entry_help()}
    </p>
  </Panel>

  <Panel>
    <p
      aria-live="polite"
      class={[
        'm-0 mb-2.5 font-mono text-[14px] font-semibold tracking-[0.04em]',
        c.summary.tone === 'ok' ? 'text-green' : c.summary.tone === 'bad' ? 'text-red' : 'text-fg'
      ]}
    >
      {c.summary.text}
    </p>
    <div class="overflow-x-auto border border-line bg-well">
      <Roll />
    </div>
    <p class={hint}>
      {m.ct_roll_help()}
    </p>
    <ul class="m-0 mt-3.5 list-none p-0">
      {#each c.issues as issue, j (j)}
        <li
          class={[
            'mb-1.5 border-l-[3px] py-[7px] pl-3 text-base leading-[1.5] text-fg-mid',
            issue.s === 'erro' ? 'border-red' : 'border-gold'
          ]}
        >
          <b
            class={[
              'mr-1.5 font-mono text-xs font-semibold tracking-[0.1em] uppercase',
              issue.s === 'erro' ? 'text-red' : 'text-gold'
            ]}>{issue.s === 'erro' ? m.ct_error() : m.ct_warning()}</b
          >{issue.m()}
        </li>
      {/each}
    </ul>
  </Panel>
</div>

<Panel label={m.ct_lily_code()}>
  <textarea
    class={[well, 'min-h-[260px] resize-y p-2.5 text-sm leading-[1.5] tracking-normal']}
    spellcheck="false"
    aria-label={m.ct_lily_code()}
    bind:value={c.lily}></textarea>
  <p class={hint}>
    {m.ct_lily_help_before()} <code>\midi {'{}'}</code>
    {m.ct_lily_help_after()}
  </p>
</Panel>
