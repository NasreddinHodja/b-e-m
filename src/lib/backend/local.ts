import type { Backend, DiarioEntry, User } from './types';

const DIARIO_KEY = 'bem_dev_diario';
const STATS_KEY = 'bem_dev_stats';
const DEV_USER: User = { uid: 'local', email: 'dev@local' };

/**
 * Offline backend for development: starts signed in, accepts any credentials,
 * and keeps the journal and stats in localStorage.
 */
export function createLocalBackend(): Backend {
  let user: User | null = DEV_USER;
  const listeners = new Set<(u: User | null) => void>();
  const emit = () => listeners.forEach((cb) => cb(user));

  const read = (): DiarioEntry[] => {
    try {
      return JSON.parse(localStorage.getItem(DIARIO_KEY) ?? '[]');
    } catch {
      return [];
    }
  };
  const write = (entries: DiarioEntry[]) =>
    localStorage.setItem(DIARIO_KEY, JSON.stringify(entries));

  return {
    auth: {
      onChange(cb) {
        listeners.add(cb);
        queueMicrotask(() => cb(user));
        return () => listeners.delete(cb);
      },
      async signIn(email) {
        user = { uid: DEV_USER.uid, email };
        emit();
      },
      async signOut() {
        user = null;
        emit();
      }
    },
    diario: {
      async list() {
        return read();
      },
      async add(_uid, entry) {
        const saved = { id: String(entry.timestamp), ...entry };
        write([saved, ...read()]);
        return saved;
      },
      async remove(_uid, id) {
        write(read().filter((e) => e.id !== id));
      }
    },
    stats: {
      async save(_uid, stats) {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
      }
    }
  };
}
