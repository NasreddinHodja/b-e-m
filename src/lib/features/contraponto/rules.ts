/** A parsed note: its spelling, diatonic step number (octave * 7 + letter) and MIDI number. */
export interface Note {
  n: string;
  dia: number;
  midi: number;
}

/** `null` is a rest. */
export type Line = (Note | null)[];

export type Species = 1 | 2;
export type Severity = 'erro' | 'aviso';

export interface Issue {
  /** Index of the offending note in the voice, or -1 for the whole voice. */
  k: number;
  s: Severity;
  m: string;
}

const L7: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const B12 = [0, 2, 4, 5, 7, 9, 11];
/** Natural pitch classes to their letter. */
export const LET: Record<number, string> = {
  0: 'C',
  2: 'D',
  4: 'E',
  5: 'F',
  7: 'G',
  9: 'A',
  11: 'B'
};

/** Parse `D4`, `F#4`, `Bb3`. */
export function parse(t: string): Note | null {
  const m = /^([A-Ga-g])([#b]*)(-?\d)$/.exec(t);
  if (!m) return null;
  const l = L7[m[1].toUpperCase()];
  const a = [...m[2]].reduce((s, c) => s + (c === '#' ? 1 : -1), 0);
  const o = +m[3];
  return { n: m[1].toUpperCase() + m[2] + o, dia: o * 7 + l, midi: 12 * (o + 1) + B12[l] + a };
}

/** Split note text on spaces and commas. */
export const tokens = (s: string) =>
  s
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);

/** Parse a voice; `rest` allows `r` or `-` as a rest. Unparseable tokens are returned in `bad`. */
export function readVoice(s: string, rest: boolean) {
  const out: Line = [];
  const bad: string[] = [];
  for (const t of tokens(s)) {
    if (rest && /^(r|-)$/i.test(t)) {
      out.push(null);
      continue;
    }
    const p = parse(t);
    if (p) out.push(p);
    else bad.push(t);
  }
  return { out, bad };
}

type Consonance = 'uni' | 'oct' | 'per' | 'imp' | 'dis';

/** Classify an interval of `st` diatonic steps and `se` semitones. */
export function cls(st: number, se: number): Consonance {
  const g = st % 7;
  const c = se % 12;
  if (g === 0) return c === 0 && (st > 0 || se === 0) ? (st === 0 ? 'uni' : 'oct') : 'dis';
  if (g === 2 && (c === 3 || c === 4)) return 'imp';
  if (g === 4 && c === 7) return 'per';
  if (g === 5 && (c === 8 || c === 9)) return 'imp';
  return 'dis';
}
const isPerf = (c: Consonance | null) => c === 'uni' || c === 'oct' || c === 'per';

/** What's wrong with the melodic step a → b, if anything; `w` marks a warning. */
function leapMsg(a: Note, b: Note): { w?: 1; m: string } | null {
  const st = Math.abs(b.dia - a.dia);
  const se = Math.abs(b.midi - a.midi);
  const up = b.midi > a.midi;
  if (st === 0) return se ? { w: 1, m: 'passo cromático sobre a mesma nota' } : null;
  if (st === 1) return se >= 1 && se <= 2 ? null : { m: 'segunda aumentada ou diminuta' };
  if (st === 2) return se === 3 || se === 4 ? null : { m: 'terça aumentada ou diminuta' };
  if (st === 3)
    return se === 5
      ? null
      : { m: se === 6 ? 'trítono (mi contra fa), difícil de cantar' : 'quarta diminuta' };
  if (st === 4) return se === 7 ? null : { m: 'quinta ' + (se < 7 ? 'diminuta' : 'aumentada') };
  if (st === 5)
    return up && se === 8
      ? null
      : {
          m:
            se === 8
              ? 'sexta menor descendente (só é admitida subindo)'
              : 'sexta maior ou aumentada (proibida)'
        };
  if (st === 6) return { m: 'salto de sétima (proibido)' };
  if (st === 7) return se === 12 ? null : { m: 'oitava aumentada ou diminuta' };
  return { m: 'salto maior que a oitava' };
}

/** Check counterpoint `cp` of species `sp` against cantus firmus `cf`; `above` if cp is the upper voice. */
export function analyze(cf: Line, cp: Line, sp: Species, above: boolean): Issue[] {
  const I: Issue[] = [];
  const add = (k: number, s: Severity, m: string) => I.push({ k, s, m });
  const n = cf.length;
  const per = sp === 1 ? 1 : 2;
  const need = sp === 1 ? n : 2 * n - 1;

  if (n < 2) {
    add(-1, 'erro', 'O cantus firmus precisa de pelo menos duas notas.');
    return I;
  }
  if (cp.length !== need) {
    add(
      -1,
      'erro',
      `Esperava ${need} notas no contraponto (${sp === 1 ? 'uma por nota do cantus firmus' : 'duas por nota, menos a última'}); há ${cp.length}.`
    );
    return I;
  }

  const cfAt = (k: number) => cf[Math.floor(k / per)]!;
  const iv = (k: number) =>
    cp[k]
      ? { st: Math.abs(cp[k].dia - cfAt(k).dia), se: Math.abs(cp[k].midi - cfAt(k).midi) }
      : null;
  const c = (k: number) => {
    const v = iv(k);
    return v ? cls(v.st, v.se) : null;
  };
  const pos = (k: number) =>
    sp === 1
      ? `compasso ${k + 1}`
      : `compasso ${Math.floor(k / 2) + 1}, tempo ${k % 2 ? 'fraco' : 'forte'}`;
  const nm = (c: Consonance | null) =>
    ({
      uni: 'uníssono',
      oct: 'oitava',
      per: 'quinta',
      imp: 'consonância imperfeita',
      dis: 'dissonância'
    })[c!];
  const strong = (k: number) => sp === 1 || k % 2 === 0;
  const idx = cp.map((_, k) => k).filter((k) => cp[k]);
  const at = (k: number) => cp[k]!;

  cp.forEach((x, k) => {
    if (!x && k > 0) add(k, 'erro', `${pos(k)}: a pausa só é admitida no início.`);
  });

  idx.forEach((k) => {
    const isAbove = at(k).midi >= cfAt(k).midi;
    if (above !== isAbove && at(k).midi !== cfAt(k).midi)
      add(k, 'aviso', `${pos(k)}: cruzamento de vozes.`);
    if (strong(k) && c(k) === 'dis')
      add(k, 'erro', `${pos(k)}: dissonância (${iv(k)!.st + 1}) no tempo forte.`);
    if (sp === 2 && !strong(k) && c(k) === 'dis') {
      const a = cp[k - 1];
      const b = cp[k + 1];
      const ok =
        a &&
        b &&
        Math.abs(at(k).dia - a.dia) === 1 &&
        Math.abs(b.dia - at(k).dia) === 1 &&
        Math.sign(at(k).dia - a.dia) === Math.sign(b.dia - at(k).dia);
      if (!ok)
        add(
          k,
          'erro',
          `${pos(k)}: dissonância no tempo fraco só como nota de passagem (grau conjunto, mesma direção).`
        );
    }
    if (strong(k) && c(k) === 'uni' && k !== idx[0] && k !== need - 1)
      add(k, 'erro', `${pos(k)}: uníssono só no início e no fim.`);
  });

  const k0 = idx[0];
  if (k0 !== undefined && c(k0) && !isPerf(c(k0)))
    add(k0, 'erro', `${pos(k0)}: comece com consonância perfeita (uníssono, quinta ou oitava).`);

  const last = need - 1;
  if (cp[last]) {
    const cl = c(last);
    if (cl === 'per') add(last, 'aviso', 'A quinta no final é fraca; prefira oitava ou uníssono.');
    else if (cl !== 'uni' && cl !== 'oct') add(last, 'erro', 'Termine em uníssono ou oitava.');
  }

  // The cadence wants a major sixth above (or minor third below) before the final note.
  const sixth = (k: number) => {
    const v = iv(k);
    return v && (above ? v.st % 7 === 5 && v.se % 12 === 9 : v.st % 7 === 2 && v.se % 12 === 3);
  };
  const wantTxt = above ? 'sexta maior' : 'terça menor';

  if (sp === 1 && n > 2 && cp[n - 2] && !sixth(n - 2))
    add(n - 2, 'aviso', `${pos(n - 2)}: o penúltimo compasso pede ${wantTxt} (cadência).`);
  if (sp === 2 && n > 2) {
    if (cp[last - 2] && c(last - 2) !== 'per')
      add(last - 2, 'aviso', `${pos(last - 2)}: o penúltimo compasso começa com quinta.`);
    if (cp[last - 1] && !sixth(last - 1))
      add(last - 1, 'aviso', `${pos(last - 1)}: depois da quinta vem ${wantTxt}.`);
  }

  // Parallel and direct motion into perfect intervals, strong beat to strong beat.
  const S = idx.filter(strong);
  for (let j = 1; j < S.length; j++) {
    const p = S[j - 1];
    const k = S[j];
    if (k - p !== per) continue;
    const d1 = Math.sign(at(k).midi - at(p).midi);
    const d2 = Math.sign(cfAt(k).midi - cfAt(p).midi);
    const kind = d1 === 0 || d2 === 0 ? 'obl' : d1 === d2 ? 'dir' : 'con';
    const ck = c(k);
    const cpv = c(p);
    if (kind !== 'dir' || !isPerf(ck)) continue;
    if (sp === 2 && cp[p + 1] && Math.abs(cp[p + 1]!.dia - at(p).dia) >= 3) continue;
    if (isPerf(cpv)) {
      const same = cpv === ck || (cpv === 'uni' && ck === 'oct') || (cpv === 'oct' && ck === 'uni');
      add(
        k,
        'erro',
        `${pos(k)}: ${same ? (ck === 'per' ? 'quintas paralelas' : 'oitavas paralelas') : 'movimento direto entre perfeitas'}.`
      );
    } else if (cpv === 'imp') {
      add(
        k,
        'erro',
        `${pos(k)}: movimento direto de imperfeita para ${nm(ck)}; use movimento contrário ou oblíquo.`
      );
    }
  }

  for (let j = 1; j < idx.length; j++) {
    const a = at(idx[j - 1]);
    const b = at(idx[j]);
    const r = leapMsg(a, b);
    if (r) add(idx[j], r.w ? 'aviso' : 'erro', `${pos(idx[j])}: ${a.n} → ${b.n}, ${r.m}.`);
    if (a.midi === b.midi && sp === 2) add(idx[j], 'aviso', `${pos(idx[j])}: nota repetida.`);
  }

  for (let j = 2; j < idx.length; j++) {
    const a = at(idx[j - 2]);
    const b = at(idx[j - 1]);
    const d = at(idx[j]);
    const s1 = Math.abs(b.dia - a.dia);
    const s2 = Math.abs(d.dia - b.dia);
    const same = Math.sign(b.midi - a.midi) === Math.sign(d.midi - b.midi) && b.midi !== a.midi;
    if (a.midi === b.midi && b.midi === d.midi && sp === 1)
      add(idx[j], 'aviso', `${pos(idx[j])}: a mesma nota três vezes seguidas.`);
    else if (same && s1 >= 2 && s2 >= 2)
      add(idx[j], 'aviso', `${pos(idx[j])}: dois saltos seguidos na mesma direção.`);
    else if (same && s1 >= 3 && s2 >= 1)
      add(idx[j], 'aviso', `${pos(idx[j])}: salto sem compensação (volte em sentido contrário).`);
  }

  const ms = idx.map((k) => at(k).midi);
  if (Math.max(...ms) - Math.min(...ms) > 16)
    add(-1, 'aviso', 'O contraponto ultrapassa uma décima; mantenha a linha cantável.');

  return I.sort((a, b) => a.k - b.k);
}

/** Parallels between two added voices `a` and `b`, measure downbeat to downbeat. */
export function pairsCheck(
  a: Line,
  b: Line,
  sa: Species,
  sb: Species,
  la: string,
  lb: string,
  n: number,
  vb: number
): (Issue & { v: number })[] {
  const out: (Issue & { v: number })[] = [];
  const at = (r: Line, s: Species, m: number) => r[s === 1 ? m : 2 * m];
  for (let m = 1; m < n; m++) {
    const p0 = at(a, sa, m - 1);
    const p1 = at(a, sa, m);
    const q0 = at(b, sb, m - 1);
    const q1 = at(b, sb, m);
    if (!p0 || !p1 || !q0 || !q1) continue;
    const d1 = Math.sign(p1.midi - p0.midi);
    const d2 = Math.sign(q1.midi - q0.midi);
    if (!d1 || d1 !== d2) continue;
    const c1 = cls(Math.abs(p1.dia - q1.dia), Math.abs(p1.midi - q1.midi));
    if (!isPerf(c1)) continue;
    const c0 = cls(Math.abs(p0.dia - q0.dia), Math.abs(p0.midi - q0.midi));
    const k = sb === 1 ? m : 2 * m;
    if (isPerf(c0)) {
      const same = c0 === c1 || (c0 !== 'per' && c1 !== 'per');
      out.push({
        v: vb,
        k,
        s: 'erro',
        m: `compasso ${m + 1}: ${same ? (c1 === 'per' ? 'quintas paralelas' : 'oitavas paralelas') : 'movimento direto entre perfeitas'} entre ${la} e ${lb}.`
      });
    } else if (c0 === 'imp') {
      out.push({
        v: vb,
        k,
        s: 'aviso',
        m: `compasso ${m + 1}: movimento direto para perfeita entre ${la} e ${lb}.`
      });
    }
  }
  return out;
}

/** Spell MIDI `m` on the nearest natural (exact, then one below, then one above) plus `acc`. */
export function spellNear(m: number, acc: string): string | null {
  for (const d of [0, -1, 1]) {
    const nat = m + d;
    const pc = ((nat % 12) + 12) % 12;
    if (LET[pc]) return LET[pc] + acc + (Math.floor(nat / 12) - 1);
  }
  return null;
}
