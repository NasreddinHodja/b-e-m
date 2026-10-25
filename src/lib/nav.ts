import type { RouteId } from '$app/types';
import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
import BookOpen from '@lucide/svelte/icons/book-open';
import Box from '@lucide/svelte/icons/box';
import EighthNotes from '@lucide/svelte/icons/eighth-notes';
import Gauge from '@lucide/svelte/icons/gauge';
import ListClock from '@lucide/svelte/icons/list-clock';
import ListMusic from '@lucide/svelte/icons/list-music';
import Metronome from '@lucide/svelte/icons/metronome';
import NotebookPen from '@lucide/svelte/icons/notebook-pen';
import Piano from '@lucide/svelte/icons/piano';
import Ruler from '@lucide/svelte/icons/ruler';
import Scale from '@lucide/svelte/icons/scale';
import type { Component } from 'svelte';
import type { QuizModule } from '#lib/session/score.svelte.js';

export interface NavItem {
  /** Route ID; pass to `resolve()` for the href. */
  route: RouteId;
  label: string;
  icon: Component;
  /** Show this quiz's score as a badge. */
  badge?: QuizModule;
  /** Use the wide content column (horizontal SVG or 3D stage). */
  wide?: boolean;
}

export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Percepção Harmônica',
    items: [
      { route: '/(app)/acordes', label: 'Acordes', icon: Piano, badge: 'h' },
      { route: '/(app)/intervalos', label: 'Intervalos', icon: ArrowLeftRight, badge: 'i' }
    ]
  },
  {
    group: 'Percepção Melódica',
    items: [
      { route: '/(app)/ditado', label: 'Ditado Melódico', icon: EighthNotes, badge: 'd' },
      { route: '/(app)/contraponto', label: 'Contraponto (Fux)', icon: Scale, wide: true }
    ]
  },
  {
    group: 'Harmonia Gráfica',
    items: [
      { route: '/(app)/regua', label: 'Régua', icon: Ruler },
      { route: '/(app)/harmonia-3d', label: 'Harmonia 3D', icon: Box, wide: true }
    ]
  },
  {
    group: 'Biblioteca & Prática',
    items: [
      { route: '/(app)/apreciacao', label: 'Apreciação', icon: ListMusic },
      { route: '/(app)/afinador', label: 'Afinador', icon: Gauge },
      { route: '/(app)/pratica', label: 'Prática', icon: NotebookPen },
      { route: '/(app)/metronomo', label: 'Metrônomo', icon: Metronome },
      { route: '/(app)/manifesto', label: 'Manifesto', icon: BookOpen },
      { route: '/(app)/historico', label: 'Histórico', icon: ListClock }
    ]
  }
];
