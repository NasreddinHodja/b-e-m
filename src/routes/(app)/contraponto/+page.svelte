<script lang="ts">
  import { contraponto as c, voiceLabel } from '#lib/features/contraponto/contraponto.svelte.js';
  import type { Species } from '#lib/features/contraponto/rules.js';
  import Panel from '#lib/ui/Panel.svelte';
  import { VOICE_COLORS } from './colors.js';
  import Roll from './Roll.svelte';

  const btn =
    'border px-2.5 py-1.5 font-mono text-xs tracking-[0.08em] uppercase transition-all duration-[140ms] disabled:cursor-not-allowed disabled:opacity-35';
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

<Panel label="Conferidor de contraponto — 1ª e 2ª espécies de Fux">
  <p class={[hint, 'mt-0!']}>
    Escreva ou desenhe as vozes, ouça o resultado e veja as regras apontando cada problema.
  </p>
  <div class="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-2">
    <button type="button" class={primary} onclick={() => c.play()}>▶ Tocar</button>
    <button type="button" class={plain} onclick={() => c.stop()}>■ Parar</button>
    <label class={barLabel}
      >Andamento
      <input type="range" min="40" max="160" class="w-[100px]" bind:value={c.bpm} />
      <span>{c.bpm}</span>
    </label>
    <label class={barLabel}><input type="checkbox" bind:checked={c.loop} /> repetir</label>
    <label class={barLabel}
      >Ao inserir nota
      <select class="w-auto text-sm" bind:value={c.acc}>
        <option value="">natural</option>
        <option value="#">sustenido</option>
        <option value="b">bemol</option>
      </select>
    </label>
    <button type="button" class={plain} onclick={() => c.addMeasure()}>+ compasso</button>
    <button type="button" class={plain} onclick={() => c.removeMeasure()}>− compasso</button>
    <button type="button" class={plain} onclick={() => c.setExample(1)}>Exemplo 1ª esp.</button>
    <button type="button" class={plain} onclick={() => c.setExample(2)}>Exemplo 2ª esp.</button>
    <button type="button" class={plain} onclick={() => c.generateLily()}>Gerar LilyPond</button>
    <button type="button" class={plain} onclick={() => c.copyLily()}>{c.copyLabel}</button>
    <button type="button" class={plain} onclick={() => c.saveLily()}>Salvar .ly</button>
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
              aria-label="Editar {voiceLabel(i)}"
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
                aria-label="Espécie"
                value={String(v.sp)}
                onchange={(e) => c.setSpecies(i, +e.currentTarget.value as Species)}
              >
                <option value="1">1ª espécie</option>
                <option value="2">2ª espécie</option>
              </select>
            {/if}
            <label
              class="m-0 inline-flex cursor-pointer items-center gap-[5px] font-mono text-xs font-medium tracking-[0.06em] text-fg-mid uppercase"
              ><input type="checkbox" bind:checked={v.on} />som</label
            >
            {#if !v.cf}
              <button
                type="button"
                class={plain}
                style:padding="1px 8px"
                title="Remover voz"
                aria-label="Remover {voiceLabel(i)}"
                onclick={() => c.removeVoice(i)}>×</button
              >
            {/if}
          </div>
          <textarea
            class={[well, 'min-h-[60px] resize-y p-2 text-base leading-[1.4]']}
            spellcheck="false"
            aria-label="Notas de {voiceLabel(i)}"
            value={v.txt}
            oninput={(e) => c.setText(i, e.currentTarget.value)}></textarea>
        </div>
      {/each}
    </div>
    <button type="button" class={plain} disabled={c.voices.length >= 4} onclick={() => c.addVoice()}
      >+ voz (até 4)</button
    >
    <p class={hint}>
      Notas separadas por espaço: letra, alteração (# ou b) e oitava; C4 é o dó central; r é pausa
      (só no início da 2ª espécie). Na 2ª espécie, duas notas por nota do cantus firmus, menos na
      última. Cada voz nova é conferida contra o cantus firmus, e as vozes novas entre si são
      conferidas quanto a paralelas.
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
      Clique ou arraste numa coluna para colocar ou mover a nota da voz selecionada; clicar perto de
      uma nota de outra voz seleciona essa voz. Anéis vermelhos são erros, âmbar são avisos. Números
      embaixo: intervalos da voz selecionada com o cantus firmus.
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
            ]}>{issue.s === 'erro' ? 'Erro' : 'Aviso'}</b
          >{issue.m}
        </li>
      {/each}
    </ul>
  </Panel>
</div>

<Panel label="Código LilyPond">
  <textarea
    class={[well, 'min-h-[260px] resize-y p-2.5 text-sm leading-[1.5] tracking-normal']}
    spellcheck="false"
    aria-label="Código LilyPond"
    bind:value={c.lily}></textarea>
  <p class={hint}>
    O código usa notas absolutas, 2/2 e converte automaticamente 1ª espécie em semibreves e 2ª
    espécie em mínimas. O bloco <code>\midi {'{}'}</code> permite gerar MIDI ao compilar no LilyPond.
  </p>
</Panel>
