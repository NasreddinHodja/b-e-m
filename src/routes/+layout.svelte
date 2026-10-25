<script lang="ts">
  import './layout.css';
  import { session } from '#lib/backend/session.svelte.js';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();

  void session.start();
</script>

{#if session.status === 'loading' || session.status === 'unreachable'}
  <div
    class="fixed inset-0 z-10000 flex flex-col items-center justify-center bg-bg font-mono text-sm tracking-[2px] text-gold"
  >
    {#if session.status === 'loading'}
      INICIANDO SISTEMA B.E.M...
    {:else}
      <div class="max-w-[440px] px-6 text-center leading-[1.9]">
        NÃO FOI POSSÍVEL CONECTAR AO FIREBASE.<br />
        <span class="text-xs tracking-[.06em] text-fg-mid">
          Abra o app pelo endereço https da sua hospedagem. Ele não funciona aberto direto do
          computador (arquivo local) nem na pré-visualização do chat. Confira também a conexão com a
          internet e se o domínio da hospedagem está em Authentication &gt; Settings &gt; Authorized
          domains, no Firebase.
        </span>
      </div>
    {/if}
  </div>
{:else}
  {@render children()}
{/if}
