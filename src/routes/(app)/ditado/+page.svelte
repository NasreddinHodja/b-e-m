<script lang="ts">
  import { ditado as d } from '#lib/features/ditado/ditado.svelte.js';
  import { renderStaff } from '#lib/features/ditado/staff.js';
  import { rhythmSymbol } from '#lib/features/ditado/rhythm.js';
  import { TONICS, degreeOf } from '#lib/features/ditado/theory.js';
  import { score } from '#lib/session/score.svelte.js';
  import Btn from '#lib/ui/Btn.svelte';
  import HistoryList from '#lib/ui/HistoryList.svelte';
  import Panel from '#lib/ui/Panel.svelte';
  import PanelLabel from '#lib/ui/PanelLabel.svelte';
  import Field from './Field.svelte';

  /** Engrave the current exercise; re-runs when a new one is generated. */
  function staff(host: HTMLDivElement) {
    const current = d.current;
    const base = d.staffBaseMidi;
    if (current) renderStaff(host, current.model, base);
  }

  const ctrl =
    'min-h-[38px] w-full border border-line-lt bg-bg px-2.5 py-2 font-mono text-base text-fg outline-none focus:border-gold';
  const grid = 'grid grid-cols-2 gap-2.5 max-[480px]:grid-cols-1';
  const hint = 'py-1 text-sm text-fg-faint italic';
  const degrees = (o: string) =>
    o
      .split(',')
      .map((x) => degreeOf(parseInt(x)))
      .join(' – ');
  const s = d.settings;
</script>

<Panel label="Configuração">
  <div class={grid}>
    <Field idx="01" label="Modo">
      <select class={ctrl} bind:value={s.mode}>
        <option value="melody">Ditado melódico</option>
        <option value="slonimsky">Slonimsky</option>
      </select>
    </Field>
    <Field idx="02" label="Tonalidade">
      <select class={ctrl} bind:value={s.key}>
        {#each TONICS as t, i (t)}<option value={String(i)}>{t}</option>{/each}
      </select>
    </Field>
    <Field idx="03" label="Escala">
      <select class={ctrl} bind:value={s.scale}>
        <option value="major">Maior</option>
        <option value="minor">Menor natural</option>
        <option value="harmonic">Menor harmônica</option>
        <option value="melodic">Menor melódica</option>
        <option value="pentMajor">Pentatônica maior</option>
        <option value="pentMinor">Pentatônica menor</option>
        <optgroup label="Modos gregos">
          <option value="ionian">Jônio</option>
          <option value="dorian">Dórico</option>
          <option value="phrygian">Frígio</option>
          <option value="lydian">Lídio</option>
          <option value="mixolydian">Mixolídio</option>
          <option value="aeolian">Eólio</option>
          <option value="locrian">Lócrio</option>
        </optgroup>
      </select>
    </Field>
    <Field idx="04" label="Compasso">
      <select class={ctrl} bind:value={s.meter}>
        <option>2/4</option>
        <option>3/4</option>
        <option>4/4</option>
        <option>6/8</option>
        <option>9/8</option>
        <option>12/8</option>
      </select>
    </Field>
  </div>

  <details class="group mt-3.5 border-t border-line pt-3">
    <summary
      class="flex cursor-pointer list-none items-center justify-between py-1 text-2xs tracking-[0.22em] text-fg-mid uppercase select-none group-open:text-gold after:text-base after:transition-[transform,color] after:duration-150 after:content-['▸'] group-open:after:[transform:rotate(90deg)] group-open:after:text-gold [&::-webkit-details-marker]:hidden"
    >
      ⚙ Parâmetros avançados
    </summary>
    <div class="animate-[fade-up_0.18s_ease] pt-3">
      <div class={s.mode === 'melody' ? 'block' : 'hidden'}>
        <div class={grid}>
          <Field idx="05" label="Compassos">
            <input
              type="number"
              inputmode="numeric"
              min="1"
              max="8"
              class={ctrl}
              value={s.bars}
              oninput={(e) => (s.bars = e.currentTarget.value)}
            />
          </Field>
          <Field idx="06" label="Ritmo">
            <select class={ctrl} bind:value={s.rhythm}>
              <option value="basic">Básico</option>
              <option value="eighth">Subdividido</option>
              <option value="varied">Variado</option>
              <option value="syncopated">Sincopado</option>
            </select>
          </Field>
          <Field idx="07" label="Extensão">
            <select class={ctrl} bind:value={s.range}>
              <option value="7">5ª</option>
              <option value="12">8ª</option>
              <option value="16">10ª</option>
            </select>
          </Field>
          <Field idx="08" label="Salto máx.">
            <select class={ctrl} bind:value={s.maxLeap}>
              <option value="5">4ª</option>
              <option value="7">5ª</option>
              <option value="12">8ª</option>
            </select>
          </Field>
          <Field idx="09" label="Movimento">
            <select class={ctrl} bind:value={s.motion}>
              <option value="step">Conjunto</option>
              <option value="mixed">Misto</option>
              <option value="leap">Saltos</option>
            </select>
          </Field>
          <Field idx="10" label="Contorno">
            <select class={ctrl} bind:value={s.contour}>
              <option value="mixed">Misto</option>
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
              <option value="arch">Arco</option>
              <option value="wave">Onda</option>
            </select>
          </Field>
          <Field idx="11" label="Foco" full>
            <select class={ctrl} bind:value={s.focus}>
              <option value="scale">Escala / graus</option>
              <option value="tonic">Tônica e dominante</option>
              <option value="thirds">3ªs</option>
              <option value="fourths">4ªs / 5ªs</option>
              <option value="chromatic">Cromatismo controlado</option>
            </select>
          </Field>
        </div>
      </div>

      <div class={s.mode === 'slonimsky' ? 'block' : 'hidden'}>
        <div class={grid}>
          <Field idx="12" label="Padrão (semitons)" full>
            <input class={ctrl} inputmode="numeric" bind:value={s.pattern} />
          </Field>
          <Field idx="13" label="Repetições">
            <input
              type="number"
              inputmode="numeric"
              min="1"
              max="8"
              class={ctrl}
              value={s.reps}
              oninput={(e) => (s.reps = e.currentTarget.value)}
            />
          </Field>
          <Field idx="14" label="Transformação">
            <select class={ctrl} bind:value={s.transform}>
              <option value="original">Original</option>
              <option value="retrograde">Retrógrado</option>
              <option value="inversion">Inversão</option>
              <option value="retro-inv">Retróg.-inv.</option>
            </select>
          </Field>
        </div>
        <div class={hint}>↻ Cada clique em Gerar transpõe o padrão dentro de A2–A5</div>
      </div>

      <div class={grid}>
        <Field idx="15" label="Andamento ♩ =" full>
          <input
            type="number"
            inputmode="numeric"
            min="30"
            max="220"
            class={ctrl}
            value={s.bpm}
            oninput={(e) => (s.bpm = e.currentTarget.value)}
          />
        </Field>
      </div>
    </div>
  </details>
</Panel>

<Panel label="Ações">
  <div class="grid grid-cols-2 gap-2">
    <Btn primary onclick={() => d.generate()}>↻ Gerar exercício</Btn>
    <Btn onclick={() => d.play()}>▶ Ouvir</Btn>
    <Btn onclick={() => d.playRoot()}>♪ Tônica</Btn>
    <Btn class="col-span-full" onclick={() => d.reveal()}>Revelar resposta</Btn>
  </div>
</Panel>

<Panel label="Mapa métrico">
  {#snippet labelExtra()}
    <span
      class={[
        'text-right',
        d.staffBlurred
          ? 'text-2xs tracking-[0.2em] text-gold uppercase'
          : 'text-xs tracking-[0.1em] text-fg-faint'
      ]}>{d.metric}</span
    >
  {/snippet}
  <div class="relative">
    <div
      {@attach staff}
      class={[
        'min-h-[170px] overflow-x-auto border border-line bg-paper p-2 transition-[filter] duration-[350ms] ease-[ease] [-webkit-overflow-scrolling:touch] [&_svg]:block',
        d.staffBlurred && 'pointer-events-none blur-[11px] saturate-[0.7] select-none'
      ]}
    ></div>
    <div
      class={[
        'pointer-events-none absolute inset-0 items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(12,12,12,0.35)_0%,rgba(12,12,12,0.15)_60%,transparent_85%)] text-xs tracking-[0.3em] text-gold uppercase [text-shadow:0_1px_0_rgba(0,0,0,0.6)]',
        d.staffBlurred ? 'flex' : 'hidden'
      ]}
    >
      🔒 ouça e adivinhe
    </div>
  </div>
</Panel>

<Panel label="Desafio auditivo">
  {#if d.quiz.kind === 'hint'}
    <div class={hint}>{d.quiz.text}</div>
  {:else}
    {@const q = d.quiz}
    <div>
      {#each q.options as o (o)}
        {@const mark =
          q.picked === null ? null : o === q.correct ? 'correct' : o === q.picked ? 'wrong' : null}
        <button
          type="button"
          disabled={q.picked !== null}
          class={[
            'my-1.5 block min-h-[46px] w-full border bg-bg p-3.5 text-left font-mono text-md tracking-[0.06em] text-fg [transition:border-color_0.12s,color_0.12s,background_0.12s]',
            mark === 'correct'
              ? 'border-green bg-green/10 text-green'
              : mark === 'wrong'
                ? 'border-red bg-red/10 text-red'
                : 'border-line hover:border-gold hover:text-gold'
          ]}
          onclick={() => d.pick(o)}
        >
          {degrees(o)}
        </button>
      {/each}
    </div>
    {#if q.answerShown}
      <div class="mt-3 border-t border-line pt-3">
        <PanelLabel class="mb-2">Resposta</PanelLabel>
        <div class="mb-2 text-lg tracking-[0.12em] text-fg">
          {#each d.current?.notes ?? [] as n, i (i)}{i > 0 ? ' – ' : ''}<span class="text-gold"
              >{degreeOf(n)}</span
            >{/each}
        </div>
        <div class="mt-2 flex flex-wrap gap-[5px]">
          {#each d.answerEvents as e, i (i)}
            <span class="border border-line px-2 py-[3px] text-sm text-gold"
              >{rhythmSymbol(e.dur)}</span
            >
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</Panel>

<details class="animate-fade-up border border-line bg-surface p-0">
  <summary
    class="flex cursor-pointer list-none items-center justify-between px-[1.4rem] py-[1.1rem] text-2xs tracking-[0.2em] text-gold uppercase"
  >
    <span>Representação musical — fonte LilyPond</span>
  </summary>
  <!-- Never filled in the legacy app either. -->
  <pre
    class="m-0 max-h-[240px] overflow-auto border-t border-line bg-well p-3 font-mono text-xs leading-[1.6] whitespace-pre-wrap text-[#cfcabd]"></pre>
  <div class="grid grid-cols-2 border-t border-line">
    <Btn
      class="[border-width:0_1px_0_0]! [border-color:var(--color-line)]!"
      pad="p-3"
      onclick={() => d.copyLily()}>{d.copyLabel}</Btn
    >
    <Btn class="[border-width:0]!" pad="p-3" onclick={() => d.downloadLily()}>⇩ Baixar .ly</Btn>
  </div>
</details>

<Panel label="Histórico do Ditado (sessão)">
  <HistoryList answers={score.recent('d')} />
</Panel>
