export interface User {
  uid: string;
  email: string | null;
}

export interface DiarioEntry {
  id: string;
  titulo: string;
  obs: string;
  /** Display date, `pt-BR` locale. */
  data: string;
  timestamp: number;
}

export type NewDiarioEntry = Omit<DiarioEntry, 'id'>;

export interface Stats {
  gScoreC: number;
  gScoreW: number;
  hScoreC: number;
  hScoreW: number;
  iScoreC: number;
  iScoreW: number;
  dScoreC: number;
  dScoreW: number;
}

export interface AuthService {
  /** Calls `cb` with the current user now or soon, then on every change. Returns an unsubscribe. */
  onChange(cb: (user: User | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

/** The signed-in user's practice journal, newest first. */
export interface DiarioRepository {
  list(uid: string): Promise<DiarioEntry[]>;
  add(uid: string, entry: NewDiarioEntry): Promise<DiarioEntry>;
  remove(uid: string, id: string): Promise<void>;
}

export interface StatsRepository {
  save(uid: string, stats: Stats): Promise<void>;
}

export interface Backend {
  auth: AuthService;
  diario: DiarioRepository;
  stats: StatsRepository;
}
