<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import { score } from '#lib/session/score.svelte.js';
  import HistoryList from '#lib/ui/HistoryList.svelte';
  import Panel from '#lib/ui/Panel.svelte';
</script>

<Panel label={m.hist_title()}>
  <HistoryList answers={score.recent()} showTag class="max-h-[500px]" />
</Panel>
