<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { session } from '#lib/backend/session.svelte.js';
  import BemLogo from '#lib/ui/BemLogo.svelte';
  import Btn from '#lib/ui/Btn.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state('');

  $effect(() => {
    if (session.status === 'signed-in') void goto(resolve('/(app)/acordes'));
  });

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = m.login_working();
    try {
      await session.signIn(email, password);
      error = '';
    } catch {
      error = m.login_failed();
    }
  }

  const label = 'text-2xs tracking-[0.1em] text-fg-mid uppercase';
  const input =
    'border border-line-lt bg-bg px-4 py-[0.8rem] font-mono text-md text-fg outline-none transition-[border-color] duration-200 focus:border-gold';
</script>

<div class="flex min-h-screen w-full flex-col items-center justify-center bg-bg">
  <div
    class="relative z-10 flex w-full max-w-[380px] flex-col gap-6 border border-line bg-surface px-10 py-12"
  >
    <div class="mb-4 flex flex-col items-center gap-3">
      <BemLogo size={56} fontSize={19} />
      <div>
        <div class="font-serif text-[24px] font-bold text-accent">{m.login_title()}</div>
        <div class="text-center text-xs leading-normal tracking-[0.15em] text-fg-faint uppercase">
          {m.app_name()}
        </div>
      </div>
    </div>
    <form onsubmit={submit} class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class={label} for="emailInput">{m.login_email()}</label>
        <input
          type="email"
          id="emailInput"
          class={input}
          placeholder={m.login_email_placeholder()}
          required
          bind:value={email}
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class={label} for="passwordInput">{m.login_password()}</label>
        <input
          type="password"
          id="passwordInput"
          class={input}
          placeholder="••••••••"
          required
          bind:value={password}
        />
      </div>
      <div class="min-h-[15px] text-center text-xs tracking-[0.05em] text-red">{error}</div>
      <Btn type="submit" primary class="mt-2" pad="p-4">{m.login_submit()}</Btn>
    </form>
  </div>
</div>
