<script lang="ts">
  import { score } from '#lib/session/score.svelte.js';
  import HistoryList from '#lib/ui/HistoryList.svelte';
  import Panel from '#lib/ui/Panel.svelte';
</script>

<Panel label="Histórico completo da sessão">
  <HistoryList answers={score.recent()} showTag class="max-h-[500px]" />
</Panel>
