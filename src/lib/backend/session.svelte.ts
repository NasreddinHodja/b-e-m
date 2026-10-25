import type { Backend, Stats, User } from './types';

/** `local` runs without Firebase (see local.ts). Defaults to local in `vite dev`, Firebase in builds. */
const kind: 'local' | 'firebase' =
  (import.meta.env.VITE_BACKEND as 'local' | 'firebase' | undefined) ??
  (import.meta.env.DEV ? 'local' : 'firebase');

/** How long to wait for the first auth answer before telling the user Firebase is unreachable. */
const BOOT_TIMEOUT_MS = 8000;

export type SessionStatus = 'loading' | 'unreachable' | 'signed-in' | 'signed-out';

/** Who is signed in, and the backend that serves their data. */
class Session {
  status = $state<SessionStatus>('loading');
  user = $state<User | null>(null);
  #backend: Backend | null = null;
  #starting: Promise<void> | null = null;

  get backend(): Backend | null {
    return this.#backend;
  }

  /** Load the backend and start following auth. Safe to call more than once. */
  start(): Promise<void> {
    this.#starting ??= this.#start();
    return this.#starting;
  }

  async #start() {
    const timer = setTimeout(() => {
      if (this.status === 'loading') this.status = 'unreachable';
    }, BOOT_TIMEOUT_MS);
    const backend =
      kind === 'local'
        ? (await import('./local')).createLocalBackend()
        : (await import('./firebase')).createFirebaseBackend();
    this.#backend = backend;
    backend.auth.onChange((user) => {
      clearTimeout(timer);
      this.user = user;
      this.status = user ? 'signed-in' : 'signed-out';
    });
  }

  async signIn(email: string, password: string) {
    await this.start();
    await this.#backend!.auth.signIn(email, password);
  }

  async signOut() {
    await this.#backend?.auth.signOut();
  }

  async saveStats(stats: Stats) {
    if (this.#backend && this.user) await this.#backend.stats.save(this.user.uid, stats);
  }
}

export const session = new Session();
