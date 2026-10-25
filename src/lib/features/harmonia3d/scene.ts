import * as THREE from 'three';
import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import { FIELDS, HEX, toneNames, type ColorKey } from './fields.js';
import type { harmonia as harmoniaState } from './harmonia.svelte.js';

type State = typeof harmoniaState;

/** Scene units per beat along Z, gap between blocks, leg thickness, floor height, axis X. */
const U = 1;
const GAP = 0.5;
const T = 0.5;
const FLOOR = -10;
const AX = -3.5;

type LabelKind = 'ev' | 'ms' | 'tone' | 'ax';
const LABEL_KINDS: LabelKind[] = ['ev', 'ms', 'tone', 'ax'];

const LAB = 'absolute top-0 left-0 whitespace-nowrap will-change-transform';
/** Per-color border/fill for chord labels. */
const EV_COLOR: Record<ColorKey, { border: string; bg: string; text: string }> = {
  gold: { border: 'border-gold', bg: 'bg-gold', text: 'text-gold' },
  green: { border: 'border-green', bg: 'bg-green', text: 'text-green' },
  red: { border: 'border-red', bg: 'bg-red', text: 'text-red' },
  ivory: { border: 'border-accent', bg: 'bg-accent', text: 'text-accent' }
};
const LABEL_CLASS: Record<LabelKind, string> = {
  ev: `${LAB} -mt-1.5 -translate-x-1/2 -translate-y-full border px-[9px] pt-0.5 pb-[3px] text-center leading-[1.2]`,
  ms: `${LAB} -translate-1/2 bg-[rgba(12,12,12,0.82)] px-1 text-xs text-fg-soft`,
  tone: `${LAB} -translate-1/2 border border-accent bg-bg px-[7px] text-base font-medium text-fg`,
  ax: `${LAB} mt-[7px] -translate-x-1/2 text-xs text-fg-mid`
};

interface EvText {
  roman: string;
  name: string;
  on: boolean;
  key: ColorKey;
}

/**
 * The three.js view of the progression: each chord a block of legs (root→3rd vertical,
 * 3rd→5th horizontal, 5th→7th descending), laid out along Z by time, with HTML labels on top.
 */
export class HarmoniaScene {
  #s: State;
  #stage: HTMLElement;
  #labels: HTMLElement;
  #renderer: THREE.WebGLRenderer;
  #scene = new THREE.Scene();
  #camera = new THREE.PerspectiveCamera(38, 1, 0.1, 900);
  #world = new THREE.Group();
  #C: Record<ColorKey, THREE.Color>;
  #disposables: { dispose(): void }[] = [];
  #ctr = new THREE.Vector3();
  #W = 1;
  #H = 1;
  #anchors: Record<LabelKind, THREE.Vector3[]> = { ev: [], ms: [], tone: [], ax: [] };
  #texts: { ev: EvText[]; ms: string[]; tone: { deg: string; name: string }[]; ax: string[] } = {
    ev: [],
    ms: [],
    tone: [],
    ax: []
  };
  #pools: Record<LabelKind, HTMLSpanElement[]> = { ev: [], ms: [], tone: [], ax: [] };
  #marker = new THREE.Group();
  #playhead = new THREE.Group();
  #ptrs = new Map<number, { x: number; y: number }>();
  #lastPinch = 0;
  #raf = 0;
  #resizeObserver: ResizeObserver;
  #cleanup: (() => void)[] = [];
  #locale = getLocale();

  constructor(state: State, stage: HTMLElement, canvas: HTMLCanvasElement, labels: HTMLElement) {
    this.#s = state;
    this.#stage = stage;
    this.#labels = labels;
    this.#renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.#renderer.setClearColor(0x0c0c0c, 1);
    this.#scene.add(this.#world);
    this.#C = {
      gold: new THREE.Color(HEX.gold),
      green: new THREE.Color(HEX.green),
      red: new THREE.Color(HEX.red),
      ivory: new THREE.Color(HEX.ivory)
    };
    this.#buildMarkerAndPlayhead();
    this.#bindPointer();
    this.#resizeObserver = new ResizeObserver(() => this.resize());
    this.#resizeObserver.observe(stage);

    this.resize();
    if (!state.started) {
      this.#fit();
      state.cam.dist = state.goal.dist;
      state.started = true;
    }
    this.#build();
    state.dirty = false;
    this.#raf = requestAnimationFrame(this.#frame);
  }

  destroy() {
    cancelAnimationFrame(this.#raf);
    this.#resizeObserver.disconnect();
    this.#cleanup.forEach((f) => f());
    this.#clearWorld();
    for (const kind of LABEL_KINDS) this.#pools[kind].forEach((el) => el.remove());
    this.#renderer.dispose();
  }

  resize() {
    const stage = this.#stage;
    this.#W = stage.clientWidth || 1;
    this.#H = stage.clientHeight || 1;
    if (stage.clientWidth === 0) return;
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.#renderer.setSize(this.#W, this.#H, false);
    this.#camera.aspect = this.#W / this.#H;
    this.#camera.updateProjectionMatrix();
    if (!this.#s.userZoomed) this.#fit();
  }

  #axisBeats() {
    return Math.max(this.#s.timeline.total, 16);
  }

  #sceneBounds() {
    return {
      min: new THREE.Vector3(-5.5, FLOOR - 1, -(this.#axisBeats() + 2.5) * U),
      max: new THREE.Vector3(7.5, 3.6, 1.5)
    };
  }

  /** Camera distance that frames the whole scene. */
  #fit() {
    const b = this.#sceneBounds();
    const R = b.max.clone().sub(b.min).length() / 2 + 2;
    const vf = (this.#camera.fov * Math.PI) / 180;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * this.#camera.aspect);
    this.#s.goal.dist = (R / Math.sin(Math.min(vf, hf) / 2)) * 0.82;
  }

  #track(...objs: { dispose(): void }[]) {
    this.#disposables.push(...objs);
  }

  #clearWorld() {
    while (this.#world.children.length) this.#world.remove(this.#world.children[0]);
    this.#disposables.forEach((o) => o.dispose());
    this.#disposables = [];
  }

  #basic(col: THREE.Color, op: number) {
    const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op });
    this.#track(m);
    return m;
  }

  #tube(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
    const dir = b.clone().sub(a);
    const len = dir.length();
    if (len < 1e-4) return;
    const g = new THREE.CylinderGeometry(r, r, len, 10, 1);
    const m = new THREE.Mesh(g, mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    this.#world.add(m);
    this.#track(g);
  }

  #ball(p: THREE.Vector3, r: number, mat: THREE.Material) {
    const g = new THREE.SphereGeometry(r, 16, 12);
    const m = new THREE.Mesh(g, mat);
    m.position.copy(p);
    this.#world.add(m);
    this.#track(g);
  }

  #cone(p: THREE.Vector3, dir: THREE.Vector3, r: number, h: number, mat: THREE.Material) {
    const g = new THREE.ConeGeometry(r, h, 14);
    const m = new THREE.Mesh(g, mat);
    m.position.copy(p);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    this.#world.add(m);
    this.#track(g);
  }

  #box(
    cx: number,
    cy: number,
    cz: number,
    w: number,
    h: number,
    d: number,
    col: THREE.Color,
    op: number
  ) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: op,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(cx, cy, cz);
    const eg = new THREE.EdgesGeometry(g);
    const lm = new THREE.LineBasicMaterial({
      color: col,
      transparent: true,
      opacity: Math.min(1, op * 3.4)
    });
    const ls = new THREE.LineSegments(eg, lm);
    ls.position.copy(mesh.position);
    this.#world.add(mesh, ls);
    this.#track(g, m, eg, lm);
  }

  #lines(pts: number[], col: THREE.Color, op: number) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const m = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op });
    this.#world.add(new THREE.LineSegments(g, m));
    this.#track(g, m);
  }

  /** Corner points of degree `i`'s block in the X/Y plane: A root, B 3rd, C 5th, D 7th. */
  #shape(i: number) {
    const d = this.#s.degrees[i];
    const t7 = this.#s.t7;
    return {
      A: { x: 0, y: 0 },
      B: { x: 0, y: -d.v },
      C: { x: d.h, y: -d.v },
      D: { x: d.h, y: -d.v - d.s * t7 },
      d
    };
  }

  #build() {
    const s = this.#s;
    const V3 = THREE.Vector3;
    const C = this.#C;
    this.#clearWorld();
    this.#anchors = { ev: [], ms: [], tone: [], ax: [] };
    this.#texts = { ev: [], ms: [], tone: [], ax: [] };
    const bnd = this.#sceneBounds();
    this.#ctr = bnd.min.clone().add(bnd.max).multiplyScalar(0.5);
    const beats = Math.ceil(this.#axisBeats());
    const zEnd = -(beats + 1) * U;
    const show3 = s.t7 > 0.03;

    // Floor grid, with stronger lines every bar.
    const soft: number[] = [];
    const hard: number[] = [];
    for (let x = -4; x <= 7; x++) soft.push(x, FLOOR, 1, x, FLOOR, zEnd);
    for (let t = 0; t <= beats + 1; t++)
      (t % 4 === 0 ? hard : soft).push(-4, FLOOR, -t * U, 7, FLOOR, -t * U);
    this.#lines(soft, C.ivory, 0.09);
    this.#lines(hard, C.ivory, 0.28);

    // Axes.
    const wm = this.#basic(C.ivory, 0.9);
    const ym = this.#basic(C.gold, 1);
    const O = new V3(AX, FLOOR, 0);
    const UP = new V3(0, 1, 0);
    this.#tube(O, new V3(AX, FLOOR + 4, 0), 0.06, wm);
    this.#cone(new V3(AX, FLOOR + 4.35, 0), UP, 0.24, 0.7, wm);
    this.#tube(O, new V3(AX + 4, FLOOR, 0), 0.06, wm);
    this.#cone(new V3(AX + 4.35, FLOOR, 0), new V3(1, 0, 0), 0.24, 0.7, wm);
    this.#tube(O, new V3(AX, FLOOR, zEnd), 0.09, ym);
    this.#cone(new V3(AX, FLOOR, zEnd - 0.5), new V3(0, 0, -1), 0.3, 0.9, ym);
    for (let t = 0; t <= beats; t++) {
      const isBar = t % 4 === 0;
      const w = isBar ? 0.8 : 0.38;
      this.#tube(
        new V3(AX - w, FLOOR, -t * U),
        new V3(AX + w, FLOOR, -t * U),
        isBar ? 0.05 : 0.03,
        wm
      );
      if (isBar && t < beats) {
        this.#anchors.ax.push(new V3(AX - 1.2, FLOOR, -t * U));
        this.#texts.ax.push(String(t / 4 + 1));
      }
    }
    this.#anchors.ax.push(new V3(AX, FLOOR + 4.9, 0));
    this.#texts.ax.push('X');
    this.#anchors.ax.push(new V3(AX + 4.9, FLOOR, 0));
    this.#texts.ax.push('Y');
    this.#anchors.ax.push(new V3(AX, FLOOR, zEnd - 1.8));
    this.#texts.ax.push(m.hg_axis_time());

    // One block per chord event.
    const playingNow = s.active >= 0;
    const prev: { nodes: { x: number; y: number }[]; z1: number }[] = [];
    s.timeline.evs.forEach((e, k) => {
      const sh = this.#shape(e.d);
      const d = sh.d;
      const key = s.colorOf(e.d);
      const col = C[key];
      const act = s.active === k;
      const dim = playingNow && !act;
      const op = act ? 0.5 : dim ? 0.12 : 0.24;
      const z0 = -e.t0 * U;
      const z1 = -e.t1 * U + GAP;
      const len = Math.max(0.3, z0 - z1);
      const zm = (z0 + z1) / 2;
      const legs = [
        [sh.A, sh.B],
        [sh.B, sh.C]
      ];
      if (show3) legs.push([sh.C, sh.D]);
      for (const [p, q] of legs) {
        const vert = Math.abs(p.x - q.x) < 1e-6;
        this.#box(
          (p.x + q.x) / 2,
          (p.y + q.y) / 2,
          zm,
          vert ? T : Math.abs(q.x - p.x) + T,
          vert ? Math.abs(q.y - p.y) + T : T,
          len,
          col,
          op
        );
      }
      const nm = this.#basic(col, dim ? 0.5 : 1);
      const nodes = [sh.A, sh.B, sh.C];
      if (show3) nodes.push(sh.D);
      nodes.forEach((p, j) => this.#ball(new V3(p.x, p.y, z0), j === 0 ? 0.42 : 0.28, nm));
      // Voice-leading threads from the previous chord's tones.
      if (prev.length) {
        const from = prev[prev.length - 1];
        nodes.forEach((p, j) => {
          if (!from.nodes[j]) return;
          const a = new V3(from.nodes[j].x, from.nodes[j].y, from.z1);
          this.#tube(a, new V3(p.x, p.y, z0), 0.03, this.#basic(C.ivory, 0.5));
        });
      }
      prev.push({ nodes, z1 });
      this.#anchors.ev.push(new V3(d.h / 2, 2.4, zm));
      this.#texts.ev.push({
        roman: FIELDS[s.field].roman[e.d],
        name: s.chordName(e.d),
        on: act,
        key
      });
      if (s.showMeasures) {
        this.#anchors.ms.push(new V3(-1.1, -d.v / 2, zm));
        this.#texts.ms.push(d.v + ' ST');
        this.#anchors.ms.push(new V3(d.h / 2, -d.v - 1.1, zm));
        this.#texts.ms.push(d.h + ' ST');
        if (show3 && s.t7 > 0.6) {
          this.#anchors.ms.push(new V3(d.h + 1.1, -d.v - (d.s * s.t7) / 2, zm));
          this.#texts.ms.push(d.s + ' ST');
        }
      }
      if (act) {
        const tn = toneNames(d, s.names[e.d]);
        const pts: [{ x: number; y: number }, number, number][] = [
          [sh.A, -1.3, 0.5],
          [sh.B, -1.3, 0],
          [sh.C, 1.3, 0],
          [sh.D, 1.3, 0]
        ];
        tn.forEach((n, j) => {
          if (j === 3 && !show3) return;
          const p = pts[j][0];
          this.#anchors.tone.push(new V3(p.x + pts[j][1], p.y + pts[j][2], z0));
          this.#texts.tone.push({ deg: ['1', '3', '5', '7'][j], name: n });
        });
      }
    });
    this.#refreshLabels();
  }

  #buildMarkerAndPlayhead() {
    const mOut = new THREE.Mesh(
      new THREE.SphereGeometry(0.66, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0xe4e0d8, depthTest: false, transparent: true })
    );
    const mIn = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0x0c0c0c, depthTest: false, transparent: true })
    );
    mOut.renderOrder = 19;
    mIn.renderOrder = 20;
    this.#marker.add(mOut, mIn);
    this.#marker.visible = false;
    this.#scene.add(this.#marker);

    const phGeo = new THREE.PlaneGeometry(12.5, -FLOOR + 3.6);
    const phMat = new THREE.MeshBasicMaterial({
      color: 0xe4e0d8,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const phEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(phGeo),
      new THREE.LineBasicMaterial({ color: 0xc8a030, transparent: true, opacity: 0.95 })
    );
    this.#playhead.add(new THREE.Mesh(phGeo, phMat), phEdge);
    this.#playhead.position.set(1.25, (FLOOR + 3.6) / 2, 0);
    this.#playhead.visible = false;
    this.#scene.add(this.#playhead);
  }

  #bindPointer() {
    const stage = this.#stage;
    const s = this.#s;
    const ptrs = this.#ptrs;
    const pinch = () => {
      const a = [...ptrs.values()];
      return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1;
    };
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
      opts?: AddEventListenerOptions
    ) => {
      stage.addEventListener(type, fn, opts);
      this.#cleanup.push(() => stage.removeEventListener(type, fn, opts));
    };
    on('pointerdown', (e) => {
      stage.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) this.#lastPinch = pinch();
    });
    on('pointermove', (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (ptrs.size === 1) {
        if (e.shiftKey || e.buttons === 2) {
          // Pan in the camera plane.
          const k = s.cam.dist * 0.0016;
          const r = new THREE.Vector3().setFromMatrixColumn(this.#camera.matrixWorld, 0);
          const u = new THREE.Vector3().setFromMatrixColumn(this.#camera.matrixWorld, 1);
          const pan = new THREE.Vector3(s.pan.x, s.pan.y, s.pan.z)
            .addScaledVector(r, -dx * k)
            .addScaledVector(u, dy * k);
          s.pan = { x: pan.x, y: pan.y, z: pan.z };
        } else {
          s.goal.theta -= dx * 0.007;
          s.goal.phi = Math.min(Math.PI - 0.2, Math.max(0.2, s.goal.phi - dy * 0.007));
        }
      } else if (ptrs.size === 2) {
        const d = pinch();
        s.goal.dist = Math.min(280, Math.max(10, (s.goal.dist * this.#lastPinch) / d));
        this.#lastPinch = d;
        s.userZoomed = true;
      }
    });
    const release = (e: PointerEvent) => ptrs.delete(e.pointerId);
    on('pointerup', release);
    on('pointercancel', release);
    on(
      'wheel',
      (e) => {
        e.preventDefault();
        s.goal.dist = Math.min(280, Math.max(10, s.goal.dist * Math.exp(e.deltaY * 0.0012)));
        s.userZoomed = true;
      },
      { passive: false }
    );
    on('contextmenu', (e) => e.preventDefault());
  }

  #updateCamera() {
    const s = this.#s;
    const f = s.reducedMotion ? 1 : 0.16;
    s.cam.theta += (s.goal.theta - s.cam.theta) * f;
    s.cam.phi += (s.goal.phi - s.cam.phi) * f;
    s.cam.dist += (s.goal.dist - s.cam.dist) * f;
    const t = this.#ctr.clone().add(new THREE.Vector3(s.pan.x, s.pan.y, s.pan.z));
    const { theta, phi, dist } = s.cam;
    this.#camera.position.set(
      t.x + dist * Math.sin(phi) * Math.sin(theta),
      t.y + dist * Math.cos(phi),
      t.z + dist * Math.sin(phi) * Math.cos(theta)
    );
    this.#camera.lookAt(t);
    this.#camera.updateMatrixWorld();
  }

  #ensure(kind: LabelKind, n: number) {
    const p = this.#pools[kind];
    while (p.length < n) {
      const el = document.createElement('span');
      el.className = LABEL_CLASS[kind];
      this.#labels.appendChild(el);
      p.push(el);
    }
    while (p.length > n) p.pop()!.remove();
  }

  #refreshLabels() {
    for (const kind of LABEL_KINDS) this.#ensure(kind, this.#anchors[kind].length);
    this.#pools.ev.forEach((el, k) => {
      const t = this.#texts.ev[k];
      const c = EV_COLOR[t.key];
      el.className = `${LABEL_CLASS.ev} ${c.border} ${t.on ? c.bg : 'bg-bg text-fg'}`;
      const rn = document.createElement('span');
      rn.className = `block text-md font-medium ${t.on ? 'text-bg' : c.text}`;
      rn.textContent = t.roman;
      const nm = document.createElement('span');
      nm.className = `block text-[10.5px] ${t.on ? 'text-bg' : 'text-fg-soft'}`;
      nm.textContent = t.name;
      el.replaceChildren(rn, nm);
    });
    this.#pools.ms.forEach((el, k) => (el.textContent = this.#texts.ms[k]));
    this.#pools.tone.forEach((el, k) => {
      const t = this.#texts.tone[k];
      const i = document.createElement('i');
      i.className = 'mr-1.5 text-2xs text-gold not-italic';
      i.textContent = t.deg;
      el.replaceChildren(i, t.name);
    });
    this.#pools.ax.forEach((el, k) => {
      const t = this.#texts.ax[k];
      el.textContent = t;
      const big = t === 'X' || t === 'Y';
      el.className = big
        ? `${LAB} -translate-1/2 text-base font-medium text-accent`
        : t.startsWith('Z')
          ? `${LABEL_CLASS.ax} tracking-[0.14em] text-gold! uppercase`
          : LABEL_CLASS.ax;
    });
  }

  #placeLabel(el: HTMLElement, v: THREE.Vector3) {
    const p = v.clone().project(this.#camera);
    el.style.transform = `translate(${((p.x * 0.5 + 0.5) * this.#W).toFixed(1)}px,${((-p.y * 0.5 + 0.5) * this.#H).toFixed(1)}px)`;
    el.style.visibility = p.z < 1 ? 'visible' : 'hidden';
  }

  #updateLabels() {
    for (const kind of LABEL_KINDS) {
      this.#pools[kind].forEach((el, k) => {
        const a = this.#anchors[kind][k];
        if (a) this.#placeLabel(el, a);
      });
    }
  }

  #frame = (now: number) => {
    this.#raf = requestAnimationFrame(this.#frame);
    const s = this.#s;
    // The axis labels are built in #build(): rebuild when the language changes.
    if (getLocale() !== this.#locale) {
      this.#locale = getLocale();
      s.dirty = true;
    }
    if (!this.#stage.offsetParent) return;
    if (s.needsFit) {
      this.#fit();
      s.needsFit = false;
    }
    if (s.t7 !== s.t7Goal) {
      s.t7 += (s.t7Goal - s.t7) * 0.16;
      if (Math.abs(s.t7Goal - s.t7) < 0.004) s.t7 = s.t7Goal;
      s.dirty = true;
    }
    const tl = s.timeline;
    if (s.playing) {
      const eb = (((now - s.playT0) / 1000) * s.bpm) / 60;
      if (eb >= tl.total) {
        s.stopPlay();
        this.#marker.visible = false;
      } else {
        const k = tl.evs.findIndex((e) => eb >= e.t0 && eb < e.t1);
        if (k !== s.lastEv && k >= 0) {
          s.lastEv = k;
          s.active = k;
          const e = tl.evs[k];
          s.playChord(e.d, ((e.b * 60) / s.bpm) * 1.02);
          s.dirty = true;
        }
        if (k >= 0) {
          const sh = this.#shape(tl.evs[k].d);
          this.#marker.position.set(sh.C.x / 2, (sh.A.y + Math.min(sh.B.y, sh.D.y)) / 2, -eb * U);
          this.#marker.visible = true;
        }
        this.#playhead.position.z = -eb * U;
      }
    } else if (s.active >= 0 && tl.evs[s.active]) {
      const e = tl.evs[s.active];
      const sh = this.#shape(e.d);
      this.#marker.position.set(
        sh.C.x / 2,
        (sh.A.y + Math.min(sh.B.y, sh.D.y)) / 2,
        -((e.t0 + e.t1) / 2) * U
      );
      this.#marker.visible = true;
    } else this.#marker.visible = false;
    this.#playhead.visible = s.playing;
    if (s.dirty) {
      this.#build();
      s.dirty = false;
    }
    this.#updateCamera();
    this.#renderer.render(this.#scene, this.#camera);
    this.#updateLabels();
  };
}
