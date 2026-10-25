<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import Panel from '#lib/ui/Panel.svelte';

  const title =
    'mt-[0.2rem] border-t border-line pt-[0.8rem] text-xs font-medium tracking-[0.16em] text-accent uppercase';
</script>

<Panel label={m.manifesto_title()}>
  <div class="flex flex-col gap-[0.9rem] text-base leading-[1.85] text-fg-mid">
    <p>
      {m.manifesto_p0a()}<br /><br />{m.manifesto_p0b()}
    </p>
    <div class={title}>{m.manifesto_t0()}</div>
    <p>
      {m.manifesto_p1()}
    </p>
    <div class={title}>{m.manifesto_t1()}</div>
    <p>
      {m.manifesto_p2()}
    </p>
    <div class={title}>{m.manifesto_t2()}</div>
    <p>
      {m.manifesto_p3()}
    </p>
    <div class={title}>{m.manifesto_t3()}</div>
    <p>
      {m.manifesto_p4()}
    </p>
    <div class={title}>{m.manifesto_t4()}</div>
    <p>
      {m.manifesto_p5()}
    </p>
    <div class={title}>{m.manifesto_t5()}</div>
    <p>
      {m.manifesto_p6()}
    </p>
    <div class={title}>{m.manifesto_t6()}</div>
    <p>
      {m.manifesto_p7()}
    </p>
    <p class="mt-6 font-medium tracking-[0.03em] text-accent">
      {m.manifesto_p8()}
    </p>
  </div>
</Panel>
