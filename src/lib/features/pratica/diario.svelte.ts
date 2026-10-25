import { session } from '#lib/backend/session.svelte.js';
import type { DiarioEntry } from '#lib/backend/types.js';

/** The signed-in user's practice journal, kept in sync with the backend. */
class Diario {
  entries = $state<DiarioEntry[]>([]);

  constructor() {
    // Reload whenever the signed-in user changes, like the legacy onAuthStateChanged hook.
    $effect.root(() => {
      $effect(() => {
        const uid = session.user?.uid;
        if (uid) void this.#load(uid);
      });
    });
  }

  async #load(uid: string) {
    this.entries = (await session.backend!.diario.list(uid)) ?? [];
  }

  async add(titulo: string, obs: string) {
    const uid = session.user?.uid;
    if (!uid) return;
    const saved = await session.backend!.diario.add(uid, {
      titulo,
      obs,
      data: new Date().toLocaleString('pt-BR'),
      timestamp: Date.now()
    });
    this.entries.unshift(saved);
  }

  async remove(id: string, index: number) {
    const uid = session.user?.uid;
    if (!uid) return;
    await session.backend!.diario.remove(uid, id);
    this.entries.splice(index, 1);
  }

  async clear() {
    const uid = session.user?.uid;
    if (!uid) return;
    for (const e of this.entries) await session.backend!.diario.remove(uid, e.id);
    this.entries = [];
  }

  exportJson() {
    const blob = new Blob([JSON.stringify(this.entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diario_bem.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const diario = new Diario();
