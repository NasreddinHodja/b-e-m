<script lang="ts">
  import { onMount } from 'svelte';
  import { FIELDS, HEX, PRESETS, pretty } from '#lib/features/harmonia3d/fields.js';
  import { harmonia as h, type ViewName } from '#lib/features/harmonia3d/harmonia.svelte.js';
  import type { HarmoniaScene } from '#lib/features/harmonia3d/scene.js';
  import Btn from '#lib/ui/Btn.svelte';
  import OptsRow from '#lib/ui/OptsRow.svelte';
  import Panel from '#lib/ui/Panel.svelte';
  import TabBtn from '#lib/ui/TabBtn.svelte';

  let stage = $state<HTMLDivElement>();
  let canvas = $state<HTMLCanvasElement>();
  let labels = $state<HTMLDivElement>();
  let message = $state<string | null>('Carregando a projeção 3D…');

  onMount(() => {
    let scene: HarmoniaScene | null = null;
    let gone = false;
    import('#lib/features/harmonia3d/scene.js')
      .then(({ HarmoniaScene }) => {
        if (gone) return;
        try {
          scene = new HarmoniaScene(h, stage!, canvas!, labels!);
          message = null;
        } catch {
          message =
            'Este navegador não conseguiu iniciar o WebGL, então a cena 3D não pode ser exibida.';
        }
      })
      .catch(() => {
        message =
          'Não foi possível carregar a biblioteca 3D. Verifique a conexão e abra a aba de novo.';
      });
    return () => {
      gone = true;
      // Leaving the page stops playback, as leaving the legacy tab did.
      h.stopPlay();
      scene?.destroy();
    };
  });

  const VIEW_BUTTONS: [ViewName, string][] = [
    ['front', 'Frente'],
    ['diag', 'Diagonal'],
    ['side', 'Lado'],
    ['top', 'Cima']
  ];
  const COLOR_VAR = {
    gold: 'var(--color-gold)',
    green: 'var(--color-green)',
    red: 'var(--color-red)',
    ivory: 'var(--color-accent)'
  };

  const progInfo = $derived.by(() => {
    if (!h.prog.length) return '';
    const total = h.timeline.total;
    const bars = total / 4;
    return (
      total +
      ' tempos, ' +
      (Number.isInteger(bars) ? bars : bars.toFixed(1).replace('.', ',')) +
      (bars === 1 ? ' compasso' : ' compassos') +
      ' em 4/4.'
    );
  });

  const legend = $derived.by(() => {
    const dr = FIELDS[h.field].roman[h.degrees.findIndex((d) => d.dom)];
    return h.tetra
      ? [
          ['green', 'Maior com sétima maior', '3ª M + 3ª m + 3ª M'],
          ['gold', 'Menor com sétima', '3ª m + 3ª M + 3ª m'],
          ['red', 'Dominante (' + dr + '7)', '3ª M + 3ª m + 3ª m'],
          ['ivory', 'Meio-diminuto (m7♭5)', '3ª m + 3ª m + 3ª M']
        ]
      : [
          ['green', 'Maior', '3ª M + 3ª m'],
          ['gold', 'Menor', '3ª m + 3ª M'],
          ['red', 'Dominante (' + dr + ')', '3ª M + 3ª m, o mesmo formato do maior'],
          ['ivory', 'Diminuto', '3ª m + 3ª m']
        ];
  });

  /** Small polyline of a degree's block shape for its button. */
  function glyph(i: number) {
    const d = h.degrees[i];
    const k = 4;
    const A = [10, 6];
    const B = [10, 6 + d.v * k];
    const C = [10 + d.h * k, 6 + d.v * k];
    const D = [C[0], C[1] + d.s * k];
    return h.tetra ? [A, B, C, D] : [A, B, C];
  }

  const note = 'mt-2 text-sm leading-[1.6] text-fg-mid';
  const sub = 'mt-3.5 mb-1.5 text-xs tracking-[0.05em] text-fg-mid';
  const sideSelect = 'w-full px-2.5 py-1.5 text-sm';
  const hudBox = 'border border-line bg-[rgba(12,12,12,0.74)]';
</script>

<Panel label="Harmonia Geométrica">
  <p class="max-w-[680px] text-base leading-[1.8] text-fg-mid">
    A harmonia em 3D. Cada acorde é um bloco geométrico definido por intervalos (X e Y), e cada
    sucessão de acordes é uma trajetória no tempo (Z).
  </p>
  <p class="mt-[0.7rem] max-w-[680px] text-xs leading-[1.8] tracking-[0.14em] text-gold uppercase">
    Mesma lógica. Mais dimensões.
  </p>
</Panel>

<div class="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-[1.2rem] max-[1100px]:grid-cols-1">
  <div
    bind:this={stage}
    class="relative h-[660px] cursor-grab touch-none overflow-hidden border border-line bg-bg active:cursor-grabbing max-[1100px]:h-[520px]"
    aria-label="Espaço 3D da Harmonia Geométrica"
  >
    <canvas bind:this={canvas} class="absolute inset-0 block size-full"></canvas>
    <div bind:this={labels} class="pointer-events-none absolute inset-0 overflow-hidden"></div>
    <div
      class={[
        hudBox,
        'pointer-events-none absolute top-3 left-3 max-w-[280px] px-3 py-2 text-[10.5px] leading-[1.7] text-fg-soft max-[1100px]:hidden'
      ]}
    >
      <b class="mb-1 block text-2xs font-medium tracking-[0.2em] text-fg-mid uppercase"
        >Eixos do sistema</b
      >
      {#each [['accent', 'X (vertical): fundamental → 3ª'], ['accent', 'Y (horizontal): 3ª → 5ª'], ['gold', 'Z (tempo): sucessão dos acordes']] as [c, text] (text)}
        <div>
          <i class="mr-2 inline-block size-2 rounded-full" style:background="var(--color-{c})"
          ></i>{text}
        </div>
      {/each}
      <div class="mt-1 text-fg-mid">A 7ª é a terceira perna: 5ª → 7ª.</div>
    </div>
    {#if message}
      <div
        class="absolute inset-0 z-2 grid place-items-center bg-bg p-6 text-center text-sm leading-[1.8] tracking-[0.08em] text-fg-mid"
      >
        {message}
      </div>
    {/if}
    <p class={[hudBox, 'absolute right-3 bottom-2.5 left-3 px-2.5 py-1 text-xs text-fg-mid']}>
      Arraste para girar · role para aproximar · Shift + arraste para mover
    </p>
  </div>

  <div class="flex flex-col gap-[1.2rem]">
    <Panel label="Campo e tonalidade">
      <OptsRow class="mt-0">
        <TabBtn
          active={h.field === 'maj'}
          aria-pressed={h.field === 'maj'}
          onclick={() => h.setField('maj')}
        >
          Campo maior
        </TabBtn>
        <TabBtn
          active={h.field === 'min'}
          aria-pressed={h.field === 'min'}
          onclick={() => h.setField('min')}
        >
          Campo menor
        </TabBtn>
      </OptsRow>
      <p class={sub}><label for="hgTonic">Tonalidade</label></p>
      <select
        id="hgTonic"
        class={sideSelect}
        value={h.tonic}
        onchange={(e) => h.setTonic(e.currentTarget.value)}
      >
        {#each FIELDS[h.field].tonics as t (t)}
          <option value={t}>{pretty(t) + ' ' + FIELDS[h.field].label}</option>
        {/each}
      </select>
      <p class={sub}>Acordes</p>
      <OptsRow class="mt-0">
        <TabBtn active={!h.tetra} aria-pressed={!h.tetra} onclick={() => h.setTetra(false)}>
          Tríades
        </TabBtn>
        <TabBtn active={h.tetra} aria-pressed={h.tetra} onclick={() => h.setTetra(true)}>
          Tétrades
        </TabBtn>
      </OptsRow>
      <p class={note}>Em tétrades surge a terceira perna do bloco, de 5ª a 7ª, descendo.</p>
    </Panel>

    <Panel label="Graus do campo">
      <div class="grid grid-cols-4 gap-1.5">
        {#each h.degrees, i (i)}
          {@const c = COLOR_VAR[h.colorOf(i)]}
          {@const pts = glyph(i)}
          <button
            type="button"
            class="flex flex-col items-center border border-line-lt bg-bg px-0.5 pt-1.5 pb-[7px] font-mono leading-[1.2] text-fg [transition:border-color_0.14s,background_0.14s] hover:border-(--c) hover:bg-surface-2"
            style:--c={c}
            onclick={() => h.addChord(i)}
          >
            <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true" class="block">
              <polyline
                points={pts.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke={HEX[h.colorOf(i)]}
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
              {#each pts as p, j (j)}
                <circle cx={p[0]} cy={p[1]} r={j === 0 ? 3.2 : 2.3} fill={HEX[h.colorOf(i)]} />
              {/each}
            </svg>
            <span class="text-md font-medium" style:color={c}>{FIELDS[h.field].roman[i]}</span>
            <span class="text-xs text-fg-mid">{h.chordName(i)}</span>
          </button>
        {/each}
      </div>
      <p class={note}>Clique num grau para ouvi-lo e acrescentá-lo ao tempo.</p>
    </Panel>

    <Panel label="Progressão no tempo">
      <select
        class={sideSelect}
        aria-label="Progressão pronta"
        value={h.preset}
        onchange={(e) => h.choosePreset(e.currentTarget.value)}
      >
        {#each PRESETS, i (i)}<option value={String(i)}>{h.presetLabel(i)}</option>{/each}
        <option value="c">Personalizada (clique nos graus)</option>
      </select>
      <p class="mt-3 min-h-10 text-base leading-[1.5] font-medium" aria-live="polite">
        {h.prog.length
          ? h.prog.map((e) => h.chordName(e.d)).join(' → ')
          : 'Clique nos graus para montar uma progressão no tempo.'}
      </p>
      <p class={[note, 'mt-0!']}>{progInfo}</p>
      <p class={sub}>Duração do próximo acorde</p>
      <OptsRow class="mt-0">
        {#each [1, 2, 4] as b (b)}
          <TabBtn active={h.dur === b} aria-pressed={h.dur === b} onclick={() => (h.dur = b)}>
            {b}
            {b === 1 ? 'tempo' : 'tempos'}
          </TabBtn>
        {/each}
      </OptsRow>
      <p class={sub}>
        <label for="hgBpm">Andamento: <output>{h.bpm}</output> BPM</label>
      </p>
      <input
        type="range"
        id="hgBpm"
        min="50"
        max="160"
        class="my-2.5 w-full"
        value={h.bpm}
        oninput={(e) => h.setBpm(+e.currentTarget.value)}
      />
      <OptsRow>
        {#each [['play', h.playing ? '■ Parar' : '▶ Tocar'], ['undo', 'Desfazer'], ['clear', 'Limpar']] as [id, text] (id)}
          <Btn
            primary={id === 'play'}
            class="flex-auto disabled:cursor-not-allowed disabled:opacity-30"
            disabled={!h.prog.length}
            onclick={() => (id === 'play' ? h.togglePlay() : id === 'undo' ? h.undo() : h.clear())}
            >{text}</Btn
          >
        {/each}
      </OptsRow>
    </Panel>

    <Panel label="Vista">
      <OptsRow class="mt-0">
        {#each VIEW_BUTTONS as [name, text] (name)}
          <TabBtn
            active={h.view === name}
            aria-pressed={h.view === name}
            onclick={() => h.setView(name)}
          >
            {text}
          </TabBtn>
        {/each}
      </OptsRow>
      <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm text-fg-soft"
        ><input
          type="checkbox"
          class="size-3.5 accent-gold"
          checked={h.showMeasures}
          onchange={(e) => h.setShowMeasures(e.currentTarget.checked)}
        /> Mostrar medidas em semitons</label
      >
    </Panel>

    <Panel label="Como ler">
      <ul
        class="flex list-none flex-col gap-2 text-sm leading-[1.6] text-fg-soft [&_b]:font-medium [&_b]:text-fg"
      >
        <li><b>X (vertical):</b> fundamental → 3ª.</li>
        <li><b>Y (horizontal):</b> 3ª → 5ª.</li>
        <li><b>Z (tempo):</b> cada acorde ocupa um trecho do eixo.</li>
      </ul>
      <p class={note}>
        A 7ª não é um eixo: é a terceira perna do bloco (5ª → 7ª), descendo a partir da 5ª.
      </p>
      <ul class="mt-3.5 flex list-none flex-col gap-2.5">
        {#each legend as [c, title, detail] (c)}
          <li
            class="grid grid-cols-[16px_1fr] items-start gap-2.5 text-sm"
            style:--c={COLOR_VAR[c as keyof typeof COLOR_VAR]}
          >
            <i
              class="mt-0.5 block size-3.5 border border-(--c) bg-[color-mix(in_srgb,var(--c)_30%,transparent)]"
            ></i>
            <div><b>{title}</b><small class="block text-xs text-fg-mid">{detail}</small></div>
          </li>
        {/each}
      </ul>
    </Panel>
  </div>
</div>
