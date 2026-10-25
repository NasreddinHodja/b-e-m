<script lang="ts">
  /** The round "BEM" mark. `size` is the circle diameter in px. */
  let { size = 42, fontSize = 15 }: { size?: number; fontSize?: number } = $props();
</script>

<div
  class="flex shrink-0 items-center justify-center rounded-full bg-logo"
  style:width="{size}px"
  style:height="{size}px"
>
  <span
    class="font-display leading-none font-black tracking-[0.02em] text-bg select-none"
    style:font-size="{fontSize}px">BEM</span
  >
</div>
