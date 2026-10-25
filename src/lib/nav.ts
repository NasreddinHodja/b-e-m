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
import { m } from '#lib/paraglide/messages.js';
import type { QuizModule } from '#lib/session/score.svelte.js';

export interface NavItem {
  /** Route ID; pass to `resolve()` for the href. */
  route: RouteId;
  /** A message: call it when rendering, so it follows the language. */
  label: () => string;
  icon: Component;
  /** Show this quiz's score as a badge. */
  badge?: QuizModule;
  /** Use the wide content column (horizontal SVG or 3D stage). */
  wide?: boolean;
}

export const NAV: { group: () => string; items: NavItem[] }[] = [
  {
    group: m.nav_group_harmonic,
    items: [
      { route: '/(app)/acordes', label: m.nav_acordes, icon: Piano, badge: 'h' },
      { route: '/(app)/intervalos', label: m.nav_intervalos, icon: ArrowLeftRight, badge: 'i' }
    ]
  },
  {
    group: m.nav_group_melodic,
    items: [
      { route: '/(app)/ditado', label: m.nav_ditado, icon: EighthNotes, badge: 'd' },
      { route: '/(app)/contraponto', label: m.nav_contraponto, icon: Scale, wide: true }
    ]
  },
  {
    group: m.nav_group_graphic,
    items: [
      { route: '/(app)/regua', label: m.nav_regua, icon: Ruler },
      { route: '/(app)/harmonia-3d', label: m.nav_harmonia, icon: Box, wide: true }
    ]
  },
  {
    group: m.nav_group_library,
    items: [
      { route: '/(app)/apreciacao', label: m.nav_apreciacao, icon: ListMusic },
      { route: '/(app)/afinador', label: m.nav_afinador, icon: Gauge },
      { route: '/(app)/pratica', label: m.nav_pratica, icon: NotebookPen },
      { route: '/(app)/metronomo', label: m.nav_metronomo, icon: Metronome },
      { route: '/(app)/manifesto', label: m.nav_manifesto, icon: BookOpen },
      { route: '/(app)/historico', label: m.nav_historico, icon: ListClock }
    ]
  }
];
