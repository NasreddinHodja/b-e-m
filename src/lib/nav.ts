import type { RouteId } from '$app/types';
import type { QuizModule } from '#lib/session/score.svelte.js';

export interface NavItem {
  /** Route ID; pass to `resolve()` for the href. */
  route: RouteId;
  label: string;
  icon: string;
  /** Show this quiz's score as a badge. */
  badge?: QuizModule;
  /** Use the wide content column (horizontal SVG or 3D stage). */
  wide?: boolean;
}

export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Percepção Harmônica',
    items: [
      { route: '/(app)/acordes', label: 'Acordes', icon: '♬', badge: 'h' },
      { route: '/(app)/intervalos', label: 'Intervalos', icon: '↔', badge: 'i' }
    ]
  },
  {
    group: 'Percepção Melódica',
    items: [
      { route: '/(app)/ditado', label: 'Ditado Melódico', icon: '♫', badge: 'd' },
      { route: '/(app)/contraponto', label: 'Contraponto (Fux)', icon: '⚖', wide: true }
    ]
  },
  {
    group: 'Harmonia Gráfica',
    items: [
      { route: '/(app)/regua', label: 'Régua', icon: '◈' },
      { route: '/(app)/harmonia-3d', label: 'Harmonia 3D', icon: '◇', wide: true }
    ]
  },
  {
    group: 'Biblioteca & Prática',
    items: [
      { route: '/(app)/apreciacao', label: 'Apreciação', icon: '♪' },
      { route: '/(app)/afinador', label: 'Afinador', icon: '◎' },
      { route: '/(app)/pratica', label: 'Prática', icon: '📓' },
      { route: '/(app)/metronomo', label: 'Metrônomo', icon: '⏱' },
      { route: '/(app)/manifesto', label: 'Manifesto', icon: '📖' },
      { route: '/(app)/historico', label: 'Histórico', icon: '○' }
    ]
  }
];
